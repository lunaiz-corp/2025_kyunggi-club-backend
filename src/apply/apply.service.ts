import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import fs from 'node:fs'
import crypto from 'node:crypto'

import type { AxiosError } from 'axios'
import { catchError, firstValueFrom } from 'rxjs'
import { Cache } from 'cache-manager'

import { customAlphabet } from 'nanoid'
import { instanceToPlain } from 'class-transformer'

import {
  StudentEntity,
  ParentEntity,
  FormAnswerEntity,
  ApplyEntity,
  CurrentStatus,
} from 'src/common/repository/entity/apply.entity'

import APIException from 'src/common/dto/APIException.dto'
import PassHashResponseDto from './dto/response/pass-hash.response.dto'
import PassCallbackResponseDto from './dto/response/pass-callback.response.dto'

import SubmitApplicationRequestDto from './dto/request/submit-application.request.dto'
import ApplicationStatusMutateRequestDto from './dto/request/application-status-mutate.request.dto'
import ApplicationStatusRetrieveRequestDto from './dto/request/application-status-retrieve.request.dto'
import RegisterCiDiRequestDto from './dto/request/register-cidi.request.dto'
import { PassEntity } from 'src/common/repository/entity/pass.entity'

const KCP_API_CONSTANTS = {
  SITECD: process.env.NODE_ENV === 'development' ? 'AO0QE' : 'AKYT9',
  API_BASEURL:
    process.env.NODE_ENV === 'development'
      ? 'https://stg-spl.kcp.co.kr/std/certpass'
      : 'https://spl.kcp.co.kr/std/certpass',
  WD_BASEURL:
    process.env.NODE_ENV === 'development'
      ? 'https://testcert.kcp.co.kr'
      : 'https://cert.kcp.co.kr',
}

@Injectable()
export class ApplyService {
  private readonly logger = new Logger(ApplyService.name)

  private readonly nanoid: (size?: number) => string

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,

    @InjectRepository(ParentEntity)
    private readonly parentRepository: Repository<ParentEntity>,

    @InjectRepository(FormAnswerEntity)
    private readonly formAnswerRepository: Repository<FormAnswerEntity>,

    @InjectRepository(ApplyEntity)
    private readonly applyRepository: Repository<ApplyEntity>,

    @InjectRepository(PassEntity)
    private readonly passDecryptedRepository: Repository<PassEntity>,

    private readonly httpService: HttpService,
  ) {
    this.nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)
  }

  async getSelectChance(): Promise<{ [key: string]: number }> {
    // 현재 있는 모든 지원서를 동아리별로 나눠서 개수를 보낸다.
    // 현재 상태는 신경쓰지말고 지원서의 단순 개수만 보자.
    const applications = await this.applyRepository.find({
      relations: ['club'],
    })

    const selectChance = applications.reduce((acc, application) => {
      if (!acc[application.club.id]) {
        acc[application.club.id] = 0
      }

      acc[application.club.id] += 1

      return acc
    }, {})

    return selectChance
  }

  async createApplication(data: SubmitApplicationRequestDto) {
    const { userInfo, parentInfo, formAnswers } = data

    // const passData = JSON.parse(
    //   (
    //     await this.passDecryptedRepository.findOne({
    //       where: { refId: userInfo.verifiedRefId },
    //     })
    //   ).data,
    // )
    // const parentPassData = JSON.parse(
    //   (
    //     await this.passDecryptedRepository.findOne({
    //       where: { refId: parentInfo.verifiedRefId },
    //     })
    //   ).data,
    // )

    const alreadyApplied = await this.studentRepository.findOne({
      where: { id: userInfo.id },
    })

    if (alreadyApplied) {
      throw new APIException(HttpStatus.CONFLICT, '이미 지원한 학생입니다.')
    }

    await this.studentRepository.insert({
      id: userInfo.id,
      name: userInfo.name,
      phone: userInfo.phone,
      // ci: passData ? (passData.ci_url as string) : undefined,
      // di: passData ? (passData.di_url as string) : undefined,
    })

    await this.parentRepository.insert({
      name: parentInfo.name,
      phone: parentInfo.phone,
      relationship: parentInfo.relationship,
      // ci: parentPassData ? (parentPassData.ci_url as string) : undefined,
      // di: parentPassData ? (parentPassData.di_url as string) : undefined,
    })

    const password = this.nanoid(6)

    const databaseQuery = {
      password,

      student: { id: userInfo.id },
      parent: { phone: parentInfo.phone },

      status: CurrentStatus.WAITING,
    }

    formAnswers.forEach(async (answers) => {
      answers.answers.forEach(async (answer) => {
        await this.formAnswerRepository.insert({
          id: `${userInfo.id}-${answers.club}-${answer.id}`,
          answer: answer.answer,
          files: answer.files,
        })
      })

      // TODO: 데이터베이스 꼬임... id값이 연동이 안되어서 추후에는 formAnswerRepository에서 직접 가져와야 하는 상황임.
      await this.applyRepository.insert({
        ...databaseQuery,
        club: { id: answers.club },
      })
    })

    try {
      await this.sendNotification(
        userInfo.id,
        formAnswers[0].club,
        'SYSTEM',
        `${userInfo.name} 님의 2025학년도 경기고등학교 이공계 동아리 지원서가 접수되었습니다.

이공계동아리연합 선발 사이트에서 본인의 지원 상태, 지원서 확인을 위해서 위 접수 번호를 꼭 기억하고, 타인에게 노출되지 않도록 유의하세요.
(접수 번호가 없을 경우 지원서 확인, 지필/면접 합격자 확인, 최종 등록 절차 진행 불가)

** 접수 번호: ${password}

본인, 혹은 본인의 자녀가 경기고등학교 이공계 동아리 접수를 하지 않은 경우, 고객센터로 문의해 주세요.`,
      )
    } catch (error) {
      this.logger.error(error)

      await this.httpService.axiosRef.post(process.env.DISCORD_WEBHOOK_URL, {
        content: `**[알림]** ${userInfo.name} 님의 지원서 알림톡 전송에 실패했습니다.`,
        embeds: [
          {
            title: '발송 시도 정보',
            fields: [
              {
                name: '학생 정보',
                value: `학번: ${userInfo.id}\n이름: ${userInfo.name}\n전화번호: ${userInfo.phone}`,
              },
              {
                name: '지원 동아리',
                value: formAnswers.map((answers) => answers.club).join(', '),
              },
              {
                name: '접수 번호',
                value: password,
              },
            ],
          },
        ],
      })
    }
  }

  async retrieveApplicationsList(club: string) {
    // Step 1: 특정 clubId를 포함하는 지원서만 가져옴
    const filteredApplications = await this.applyRepository.find({
      select: ['student', 'club', 'status'],
      relations: ['student', 'club'],
      where: { club: { id: club } },
    })

    if (filteredApplications.length === 0) {
      return {} // 특정 clubId에 해당하는 데이터가 없으면 빈 객체 반환
    }

    // Step 2: 해당 지원서의 studentId을 가져와서 해당 사용자의 모든 club 신청 데이터 조회
    const studentIds = filteredApplications
      .map((app) => app.student.id)
      .filter(Boolean)

    const allApplications = await this.applyRepository.find({
      select: ['student', 'club', 'status'],
      relations: ['student', 'club'],
      where: studentIds.map((id) => ({ student: { id } })),
    })

    // Step 3: 그룹화하여 최종 데이터 변환
    const grouped = allApplications.reduce(
      (acc, apply) => {
        const plainApply = instanceToPlain(apply) // BaseEntity 메서드 제거
        const { status, club, id, ...rest } = plainApply // id 제거

        // student의 ci, di 필드 삭제
        if (rest.student) {
          delete rest.student.ci
          delete rest.student.di
        }

        if (!acc[status]) {
          acc[status] = {}
        }

        const userId = rest.student.id
        if (!acc[status][userId]) {
          acc[status][userId] = {
            userInfo: { ...rest.student }, // student 객체를 userInfo로 변경
            applingClubs: [], // club 리스트 저장할 배열
          }
        }

        acc[status][userId].applingClubs.push(club.id) // club의 이름을 배열에 추가
        return acc
      },
      {} as Record<string, Record<string, any>>,
    )

    // 중첩 객체를 배열 형태로 변환
    const result = Object.fromEntries(
      Object.entries(grouped).map(([status, users]) => [
        status,
        Object.values(users),
      ]),
    )

    return result
  }

  async sendBulkNotification(
    ids: number[],
    club: string,
    type: 'SYSTEM' | 'MANUAL',
    content: string,
  ) {
    const applications = await this.applyRepository.find({
      where: {
        student: ids.map((id) => ({ id })),
        club: { id: club },
      },
    })

    const { data: alimTalk } = await firstValueFrom(
      this.httpService
        .post(
          `https://api-alimtalk.cloud.toast.com/friendtalk/v2.4/appkeys/${process.env.KAKAO_APP_KEY}/messages`,
          {
            senderKey: process.env.KAKAO_SENDER_KEY,
            recipientList: applications.map((application) => ({
              recipientNo: application.student.phone,
              content,
              buttons:
                type === 'SYSTEM'
                  ? [
                      {
                        ordering: 1,
                        type: 'WL',
                        name: '지원서 상태 확인',
                        linkMo: 'https://kyunggi.club/apply/status',
                        linkPc: 'https://kyunggi.club/apply/status',
                      },
                    ]
                  : [],
              resendParameter: {
                isResend: true,
                resendSendNo: process.env.KAKAO_SENDER_PHONE,
              },
              isAd: false,
            })),
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data)
            throw new APIException(500, '알림톡 전송에 실패했습니다.')
          }),
        ),
    )

    return alimTalk
  }

  async retrieveApplication(id: number, club: string) {
    const application = await this.applyRepository.findOne({
      where: {
        student: { id },
        club: { id: club },
      },
      relations: ['student', 'club', 'parent'],
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    const answers = (await this.formAnswerRepository.find()).filter((answer) =>
      answer.id.startsWith(`${id}-${club}-`),
    )

    return {
      userInfo: {
        id: application.student.id,
        name: application.student.name,
        phone: application.student.phone,
      },

      parentInfo: {
        name: application.parent.name,
        relationship: application.parent.relationship,
        phone: application.parent.phone,
      },

      currentStatus: application.status,

      formAnswers: answers
        .map((answer) => ({
          ...answer,
          id: Number(answer.id.split('-')[2]),
        }))
        .sort((a, b) => a.id - b.id),
    }
  }

  async retrieveApplicationForStudent(
    id: number,
    body: ApplicationStatusRetrieveRequestDto,
  ) {
    const applications = await this.applyRepository.find({
      where: {
        student: { id, name: body.studentName },
        password: body.password,
      },
      relations: ['student', 'club', 'parent'],
    })

    if (applications.length === 0) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    if (applications.some((application) => !application.student.ci)) {
      // 부모 CI도 없는지 확인
      if (applications.some((application) => !application.parent.ci)) {
        throw new APIException(
          HttpStatus.LOCKED,
          '실명 인증이 완료되지 않은 사용자입니다.',
        )
      }
    }

    const answers = (await this.formAnswerRepository.find()).filter((answer) =>
      answer.id.startsWith(`${id}-`),
    )

    return {
      userInfo: {
        ...applications[0].student,
        ci: undefined,
        di: undefined,
      },

      applingClubs: applications
        .sort((a, b) => a.club.name.localeCompare(b.club.name))
        .map((application) => application.club.id),
      currentStatus: applications
        .sort((a, b) => a.club.name.localeCompare(b.club.name))
        .map((application) => ({
          club: application.club.id,
          status: application.status,
        })),

      formAnswers: applications
        .sort((a, b) => a.club.name.localeCompare(b.club.name))
        .map((application) => ({
          club: application.club.id,
          answers: answers
            .filter((answer) =>
              answer.id.startsWith(`${id}-${application.club.id}`),
            )
            .map((answer) => ({
              ...answer,
              id: Number(answer.id.split('-')[2]),
            }))
            .sort((a, b) => a.id - b.id),
        })),
    }
  }

  async registerCiDi(id: number, body: RegisterCiDiRequestDto) {
    const applications = await this.applyRepository.find({
      where: {
        student: { id, name: body.studentName },
        password: body.password,
      },
      relations: ['student', 'club', 'parent'],
    })

    if (applications.length === 0) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    if (
      applications.every((application) => application.student.ci) ||
      applications.every((application) => application.parent.ci)
    ) {
      throw new APIException(
        HttpStatus.LOCKED,
        '이미 실명 인증된 사용자입니다.',
      )
    }

    const decryptedData = JSON.parse(
      (
        await this.passDecryptedRepository.findOne({
          where: {
            refId: body.verifiedRefId,
          },
        })
      )?.data ?? '{}',
    )

    if (!decryptedData.ci) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '일치하는 실명 인증건을 찾을 수 없습니다.',
      )
    }

    const isParent =
      new Date().getFullYear() - Number(decryptedData.birth_day.slice(0, 4)) >=
      25

    if (isParent) {
      if (applications[0].parent.phone !== decryptedData.phone_no) {
        throw new APIException(
          HttpStatus.FORBIDDEN,
          '등록된 전화번호와 인증한 전화번호가 일치하지 않습니다.',
        )
      }

      await this.parentRepository.update(
        {
          phone: applications[0].parent.phone,
        },
        {
          ci: decryptedData.ci,
          di: decryptedData.di,
        },
      )
    } else {
      if (applications[0].student.phone !== decryptedData.phone_no) {
        throw new APIException(
          HttpStatus.FORBIDDEN,
          '등록된 전화번호와 인증한 전화번호가 일치하지 않습니다.',
        )
      }

      await this.studentRepository.update(
        {
          id,
        },
        {
          ci: decryptedData.ci,
          di: decryptedData.di,
        },
      )
    }
  }

  async updateApplicationStatus(
    club: string,
    id: number,
    data: ApplicationStatusMutateRequestDto,
  ) {
    const application = await this.applyRepository.findOne({
      where: {
        student: { id },
        club: { id: club },
      },
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    await this.applyRepository.update(
      {
        student: { id },
        club: { id: club },
      },
      {
        status: data.status,
      },
    )
  }

  async sendNotification(
    id: number,
    club: string,
    type: 'SYSTEM' | 'MANUAL',
    content: string,
  ) {
    const application = await this.applyRepository.findOne({
      where: {
        student: { id },
        club: { id: club },
      },
    })

    if (type === 'MANUAL' && !application) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return this.sendBulkNotification([id], club, type, content)
  }

  async finalSubmit(club: string, id: number) {
    const application = await this.applyRepository.findOne({
      where: {
        student: { id },
        club: { id: club },
      },
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    await this.applyRepository.update(
      {
        student: { id },
        club: { id: club },
      },
      {
        status: CurrentStatus.FINAL_SUBMISSION,
      },
    )
  }

  async getPassHashData(
    orderId: string,
    device: 'pc' | 'android' | 'ios',
  ): Promise<PassHashResponseDto> {
    const cachedHashData = await this.cacheManager.get<PassHashResponseDto>(
      `pass-hashdata:${orderId}`,
    )

    if (cachedHashData) {
      return cachedHashData
    }

    const orderIdRegex = /^KGH\d{14}@\w{10}$/
    if (!orderId || !orderIdRegex.test(orderId)) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        "올바르지 않은 'orderId' 형식입니다.",
      )
    }

    if (!device || !['pc', 'android', 'ios'].includes(device)) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        "올바르지 않은 'device' 형식입니다.",
      )
    }

    const ctType = 'HAS'
    const taxNo = '000000'

    const formattedTime = new Date()
      .toISOString()
      .slice(2)
      .replace(/[-T:]/g, '')
      .split('.')[0]

    const signatureData = this.passSignatureData(
      `${KCP_API_CONSTANTS.SITECD}^${ctType}^${taxNo}^${formattedTime}`,
    )

    const { data } = await firstValueFrom(
      this.httpService.post(KCP_API_CONSTANTS.API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: KCP_API_CONSTANTS.SITECD,
        ordr_idxx: orderId,
        ct_type: ctType,
        web_siteid: '',
        tax_no: taxNo,
        make_req_dt: formattedTime,
        kcp_sign_data: signatureData,
      }),
    )

    this.logger.debug(`[KCP Request] => ${KCP_API_CONSTANTS.API_BASEURL}`, {
      kcp_cert_info: this.passSerializedCert('public'),
      site_cd: KCP_API_CONSTANTS.SITECD,
      ordr_idxx: orderId,
      ct_type: ctType,
      web_siteid: '',
      tax_no: taxNo,
      make_req_dt: formattedTime,
      kcp_sign_data: signatureData,
    })

    this.logger.debug(
      `[KCP Response] => ${KCP_API_CONSTANTS.API_BASEURL}`,
      data,
    )

    const passReqData = {
      data: {
        // 결과 코드
        res_cd: data.res_cd,

        // 결과 메시지
        res_msg: data.res_msg,
      },
      url:
        data.res_cd === '0000'
          ? `${KCP_API_CONSTANTS.WD_BASEURL}/kcp_cert/cert_view.jsp`
          : undefined,
      formData:
        data.res_cd === '0000'
          ? {
              // 사이트 코드
              site_cd: KCP_API_CONSTANTS.SITECD,

              // 요청 번호
              ordr_idxx: orderId,

              // 요청 종류
              // 고정값 CERT
              req_tx: 'CERT',

              // 요청 구분
              // 고정값 01
              cert_method: '01',

              // 요청 hash data
              up_hash: data.up_hash,

              // cert_otp_use 필수 (메뉴얼 참고)
              // Y : 실명 확인 + OTP 점유 확인 , N : 실명 확인 only
              cert_otp_use: 'Y',

              // web_siteid 검증 을 위한 필드
              // web_siteid 사용시 Y로 전달
              web_siteid_hashYN: '',

              // 웹사이트 아이디
              // web_siteid 사용시 전달
              web_siteid: '',

              // Ret_URL
              Ret_URL: `${
                data.res_cd === '0000' && process.env.NODE_ENV === 'development'
                  ? 'http://192.168.1.60:4000'
                  : 'https://api.kyunggi.club'
              }/apply/pass/callback`,

              // 리턴 암호화 고도화
              // 고정값 Y
              cert_enc_use_ext: 'Y',

              // [API 전용 필드] NHN KCP로 넘기는 상점 서버 시간
              // up_hash 생성 후 리턴받은 값 그대로 전달
              kcp_merchant_time: data.kcp_merchant_time,

              // KCP 본인확인 라이브러리 버전 정보
              // API의 경우: up_hash 생성 후 리턴받은 값 그대로 전달
              kcp_cert_lib_ver: data.kcp_cert_lib_ver,

              // [iOS 전용 필드] PASS 앱 스키마 등록 이후 추가 변수
              // iOS에서 PASS 앱 호출 방식으로 이용시 "Y" 설정
              kcp_cert_pass_use: device === 'ios' ? 'Y' : undefined,

              // [Android 전용 필드] PASS 앱 intent 처리 이후 추가 변수
              // Android에서 PASS 앱 호출 방식으로 이용시 "Y" 설정
              kcp_cert_intent_use: device === 'android' ? 'Y' : undefined,

              // [2023-11-27 KCP 김민규] 페이지 전환 호출 파라미터 추가
              // 본인확인창을 페이지 전환 방식으로 호출하고자 할 경우 "Y" 설정하여 호출 바랍니다.
              kcp_page_submit_yn: 'Y',
            }
          : undefined,
    }

    await this.cacheManager.set(`pass-hashdata:${orderId}`, passReqData)
    return passReqData
  }

  async getPassVerifyResult(
    orderId: string,
    data: {
      certNo: string
      dnHash: string
      certData: string
    },
  ): Promise<PassCallbackResponseDto> {
    const verifyCtType = 'CHK'

    const verifySignatureData = this.passSignatureData(
      `${KCP_API_CONSTANTS.SITECD}^${verifyCtType}^${data.certNo}^${data.dnHash}`,
    )

    const { data: dnHashVerify } = await firstValueFrom(
      this.httpService.post(KCP_API_CONSTANTS.API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: KCP_API_CONSTANTS.SITECD,
        ordr_idxx: orderId,
        ct_type: verifyCtType,
        dn_hash: data.dnHash,
        cert_no: data.certNo,
        kcp_sign_data: verifySignatureData,
      }),
    )

    if (!dnHashVerify.res_cd || dnHashVerify.res_cd !== '0000') {
      this.logger.debug(dnHashVerify)
      throw new APIException(
        400,
        '위변조가 의심되는 인증정보입니다. 다시 시도해주세요.',
      )
    }

    const decryptCtType = 'DEC'
    const decryptSignatureData = this.passSignatureData(
      `${KCP_API_CONSTANTS.SITECD}^${decryptCtType}^${data.certNo}`,
    )

    this.logger.debug(`[KCP Request] => ${KCP_API_CONSTANTS.API_BASEURL}`, {
      kcp_cert_info: this.passSerializedCert('public'),
      site_cd: KCP_API_CONSTANTS.SITECD,
      ordr_idxx: orderId,
      ct_type: decryptCtType,
      cert_no: data.certNo,
      enc_cert_Data: data.certData,
      kcp_sign_data: decryptSignatureData,
    })

    const { data: decryptedData } = await firstValueFrom(
      this.httpService.post(KCP_API_CONSTANTS.API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: KCP_API_CONSTANTS.SITECD,
        ordr_idxx: orderId,
        ct_type: decryptCtType,
        cert_no: data.certNo,
        enc_cert_Data: data.certData,
        kcp_sign_data: decryptSignatureData,
      }),
    )

    this.logger.debug(
      `[KCP Response] => ${KCP_API_CONSTANTS.API_BASEURL}`,
      decryptedData,
    )

    await this.cacheManager.del(`pass-hashdata:${orderId}`)

    await this.passDecryptedRepository.save({
      refId: orderId,
      data: JSON.stringify(decryptedData),
    })

    return {
      res_cd: decryptedData.res_cd,
      res_msg: decryptedData.res_msg,

      user_name: decryptedData.user_name,
      phone_no: decryptedData.phone_no,

      // 25세 이상인지 확인 (만약 사용자가 10세에 출산한 경우를 기준으로 할 때, 현재 자녀가 고1 (15세) 이려면 25세 이상이어야 함)
      is_parent:
        new Date().getFullYear() -
          Number(decryptedData.birth_day.slice(0, 4)) >=
        25,
    }
  }

  passSerializedCert(certType: string): string {
    const cert = fs
      .readFileSync(
        certType === 'private'
          ? 'credentials/kcp/splPrikeyPKCS8.pem'
          : 'credentials/kcp/splCert.pem',
      )
      .toString()

    return cert.replaceAll('\r', '').replaceAll('\n', '')
  }

  passSignatureData(data: any): string {
    const key = fs.readFileSync('credentials/kcp/splPrikeyPKCS8.pem').toString()
    const passphrase = process.env.KCP_PASSPHARASE ?? 'changeit'

    return crypto.createSign('sha256').update(data).sign(
      {
        format: 'pem',
        key: key,
        passphrase: passphrase,
      },
      'base64',
    )
  }
}
