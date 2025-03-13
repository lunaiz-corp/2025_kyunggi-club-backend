import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import fs from 'node:fs'
import crypto from 'node:crypto'

import type { AxiosError } from 'axios'
import { catchError, firstValueFrom } from 'rxjs'
import { Cache } from 'cache-manager'

import { customAlphabet } from 'nanoid'

import { stringify } from 'csv-stringify/sync'

import { Apply, CurrentStatus } from 'src/common/repository/schema/apply.schema'
import { PassSession } from 'src/common/repository/schema/pass.schema'

import APIException from 'src/common/dto/APIException.dto'
import PassHashResponseDto from './dto/response/pass-hash.response.dto'
import PassCallbackResponseDto from './dto/response/pass-callback.response.dto'

import SubmitApplicationRequestDto from './dto/request/submit-application.request.dto'
import ApplicationStatusMutateRequestDto, {
  ApplicationStatusBulkMutateRequestDto,
} from './dto/request/application-status-mutate.request.dto'
import ApplicationStatusRetrieveRequestDto from './dto/request/application-status-retrieve.request.dto'
import RegisterCiDiRequestDto from './dto/request/register-cidi.request.dto'
import ApplicationExportExcelRequestDto from './dto/request/application-export-excel.request.dto'

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

    @InjectModel(Apply.name)
    private readonly applyModel: Model<Apply>,

    @InjectModel(PassSession.name)
    private readonly passSessionModel: Model<PassSession>,

    private readonly httpService: HttpService,
  ) {
    this.nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)
  }

  async getSelectChance(): Promise<{ [key: string]: number }> {
    // 현재 있는 모든 지원서를 동아리별로 나눠서 개수를 보낸다.
    // 현재 상태는 신경쓰지말고 지원서의 단순 개수만 보자.
    const applications = await this.applyModel.find()

    const selectChance = applications.reduce((acc, application) => {
      application.answers.forEach((answer) => {
        if (!acc[answer.club]) {
          acc[answer.club] = 0
        }

        acc[answer.club] += 1
      })

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

    const alreadyApplied = await this.applyModel.findOne({
      'student.id': userInfo.id,
    })

    if (alreadyApplied) {
      throw new APIException(HttpStatus.CONFLICT, '이미 지원한 학생입니다.')
    }

    const password = this.nanoid(6)

    const databaseQuery = {
      password,

      student: {
        id: userInfo.id,
        name: userInfo.name,
        phone: userInfo.phone,
        // ci: userInfo.ci,
        // di: userInfo.di,
      },
      parent: {
        name: parentInfo.name,
        phone: parentInfo.phone,
        relationship: parentInfo.relationship,
        // ci: parentInfo.ci,
        // di: parentInfo.di,
      },
    }

    // TODO: 데이터베이스 꼬임... 동아리 별 지망 값이 연동이 안되어서 추후에는 formAnswerRepository에서 직접 가져와야 하는 상황임.
    await this.applyModel.create({
      ...databaseQuery,
      answers: formAnswers.map((answers) => ({
        club: answers.club,
        status: CurrentStatus.WAITING,
        answers: answers.answers,
      })),
    })

    await firstValueFrom(
      this.httpService
        .post(
          `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${process.env.KAKAO_APP_KEY}/messages`,
          {
            senderKey: process.env.KAKAO_SENDER_KEY,
            templateCode: 'APPLY_SUBMITTED',

            recipientList: [
              {
                recipientNo: userInfo.phone,
                templateParameter: {
                  NAME: userInfo.name,
                  PASSWORD: password,
                },
              },
            ],

            resendParameter: {
              isResend: true,
              resendSendNo: process.env.KAKAO_SENDER_PHONE,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data)

            this.httpService.axiosRef.post(process.env.DISCORD_WEBHOOK_URL, {
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
                      value: formAnswers
                        .map((answers) => answers.club)
                        .join(', '),
                    },
                    {
                      name: '접수 번호',
                      value: password,
                    },
                  ],
                },
              ],
            })

            throw new APIException(500, '알림톡 전송에 실패했습니다.')
          }),
        ),
    )
  }

  async retrieveApplicationsList(club: string) {
    // 특정 Club ID를 포함하는 모든 지원서 return
    const applications = await this.applyModel.find({
      answers: { $elemMatch: { club } },
    })

    // 현재 club값에 대한 status에 따라 분류
    const grouped = applications.reduce((acc, application) => {
      application.answers.forEach((answer) => {
        if (!acc[answer.club]) {
          acc[answer.club] = {}
        }

        if (!acc[answer.club][answer.status]) {
          acc[answer.club][answer.status] = []
        }

        acc[answer.club][answer.status].push({
          applingClubs: application.answers.map(
            (application) => application.club,
          ),
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
        })
      })

      return acc
    }, {})

    return grouped[club]
  }

  async sendBulkNotification(ids: number[], club: string, content: string) {
    const shouldMms = new TextEncoder().encode(content).length > 90

    const applications = await this.applyModel.find({
      'student.id': { $in: ids },
      answers: { $elemMatch: { club } },
    })

    const { data: messaging } = await firstValueFrom(
      this.httpService
        .post(
          `https://api-sms.cloud.toast.com/sms/v3.0/appkeys/${process.env.KAKAO_APP_KEY}/sender/${shouldMms ? 'mms' : 'sms'}`,
          {
            title: shouldMms ? '[이공계동아리연합]' : undefined,
            body: content,
            sendNo: process.env.KAKAO_SENDER_PHONE,

            recipientList: applications.map((application) => ({
              recipientNo: application.student.phone,
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

    return messaging
  }

  async retrieveApplication(id: number, club: string) {
    const application = (
      await this.applyModel.findOne({
        'student.id': id,
        answers: { $elemMatch: { club } },
      })
    ).toObject()

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    return {
      userInfo: {
        id: application.student.id,
        name: application.student.name,
        phone: application.student.phone,
      },

      parentInfo: {
        name: application.parent?.name,
        relationship: application.parent?.relationship,
        phone: application.parent?.phone,
      },

      currentStatus: application.answers.find((a) => a.club === club).status,

      formAnswers: application.answers
        .find((a) => a.club === club)
        .answers.sort((a, b) => a.id - b.id),
    }
  }

  async downloadExcel(club: string, body: ApplicationExportExcelRequestDto) {
    const { ids } = body

    const applications = await this.applyModel.find({
      'student.id': { $in: ids },
      answers: { $elemMatch: { club } },
    })

    const csv = stringify(
      [
        ['id', 'name', 'phone'],
        ...applications.map((application) => [
          application.student.id.toString(),
          application.student.name.toString(),
          application.student.phone.toString(),
        ]),
      ],
      { bom: true },
    )

    return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv)])
  }

  async retrieveApplicationForStudent(
    id: number,
    body: ApplicationStatusRetrieveRequestDto,
  ) {
    const application = await this.applyModel.findOne({
      'student.id': id,
      'student.name': body.studentName,
      password: body.password,
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    if (!application.student.ci) {
      // 부모 CI도 없는지 확인
      if (application.parent && !application.parent.ci) {
        throw new APIException(
          HttpStatus.LOCKED,
          '실명 인증이 완료되지 않은 사용자입니다.',
        )
      }
    }

    return {
      userInfo: {
        ...application.student,
        ci: undefined,
        di: undefined,
      },

      applingClubs: application.answers
        .map((application) => application.club)
        .sort((a, b) => a.localeCompare(b)),

      currentStatus: application.answers
        .map((application) => ({
          club: application.club,
          status: application.status,
        }))
        .sort((a, b) => a.club.localeCompare(b.club)),

      formAnswers: application.answers
        .map((application) => {
          return {
            club: application.club,
            answers: application.answers,
          }
        })
        .sort((a, b) => a.club.localeCompare(b.club)),
    }
  }

  async registerCiDi(id: number, body: RegisterCiDiRequestDto) {
    const application = await this.applyModel.findOne({
      'student.id': id,
      'student.name': body.studentName,
      password: body.password,
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    if (application.student.ci || application.parent.ci) {
      throw new APIException(
        HttpStatus.LOCKED,
        '이미 실명 인증된 사용자입니다.',
      )
    }

    const decryptedData = JSON.parse(
      (
        await this.passSessionModel.findOne({
          refId: body.verifiedRefId,
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
      if (application.parent.phone !== decryptedData.phone_no) {
        throw new APIException(
          HttpStatus.FORBIDDEN,
          '등록된 전화번호와 인증한 전화번호가 일치하지 않습니다.',
        )
      }

      await this.applyModel.updateOne(
        {
          'parent.phone': application.parent.phone,
        },
        {
          $set: {
            'parent.ci': decryptedData.ci,
            'parent.di': decryptedData.di,
          },
        },
      )
    } else {
      if (application.student.phone !== decryptedData.phone_no) {
        throw new APIException(
          HttpStatus.FORBIDDEN,
          '등록된 전화번호와 인증한 전화번호가 일치하지 않습니다.',
        )
      }

      await this.applyModel.updateOne(
        { 'student.id': id },
        {
          $set: {
            'student.ci': decryptedData.ci,
            'student.di': decryptedData.di,
          },
        },
      )
    }
  }

  async updateApplicationStatus(
    club: string,
    id: number,
    data: ApplicationStatusMutateRequestDto,
  ) {
    const application = await this.applyModel.findOne({
      'student.id': id,
      answers: { $elemMatch: { club } },
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    await this.applyModel.updateOne(
      {
        'student.id': id,
        answers: { $elemMatch: { club } },
      },
      {
        $set: {
          'answers.$.status': data.status,
        },
      },
    )
  }

  async updateApplicationStatusBulk(
    club: string,
    data: ApplicationStatusBulkMutateRequestDto,
  ) {
    const applications = await this.applyModel.find({
      'student.id': { $in: data.ids },
      answers: { $elemMatch: { club } },
    })

    if (applications.length !== data.ids.length) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서가 포함되어 있습니다.',
      )
    }

    function getNextStatus(currentStatus: CurrentStatus, isPassed: boolean) {
      if (!isPassed) {
        switch (currentStatus) {
          case CurrentStatus.WAITING:
            return CurrentStatus.DOCUMENT_REJECTED
          case CurrentStatus.DOCUMENT_PASSED:
            return CurrentStatus.EXAM_REJECTED
          case CurrentStatus.EXAM_PASSED:
            return CurrentStatus.INTERVIEW_REJECTED
          default:
            return null
        }
      } else {
        switch (currentStatus) {
          case CurrentStatus.WAITING:
            return CurrentStatus.DOCUMENT_PASSED
          case CurrentStatus.DOCUMENT_PASSED:
            return CurrentStatus.EXAM_PASSED
          case CurrentStatus.EXAM_PASSED:
            return CurrentStatus.INTERVIEW_PASSED
          default:
            return null
        }
      }
    }

    const jobs = []

    jobs.push(
      ...data.ids.map((id) => ({
        filter: {
          'student.id': id,
          answers: { $elemMatch: { club } },
        },
        update: {
          $set: {
            'answers.$.status': getNextStatus(
              applications
                .find((a) => a.student.id === id)
                .answers.find((a) => a.club === club).status,
              data.status === 'PASSED',
            ),
          },
        },
      })),
    )

    await this.applyModel.bulkWrite(
      jobs.map((job) => ({
        updateOne: {
          filter: job.filter,
          update: job.update,
        },
      })),
    )
  }

  async sendNotification(id: number, club: string, content: string) {
    const application = await this.applyModel.findOne({
      'student.id': id,
      answers: { $elemMatch: { club } },
    })

    if (!application) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return this.sendBulkNotification([id], club, content)
  }

  async finalSubmit(club: string, id: number) {
    const application = await this.applyModel.findOne({
      'student.id': id,
      answers: { $elemMatch: { club } },
    })

    if (!application) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '존재하지 않는 지원서입니다.',
      )
    }

    // TODO: 추합 떄 말고는 FINAL_PASSED로
    await this.applyModel.updateOne(
      {
        'student.id': id,
        answers: { $elemMatch: { club } },
      },
      {
        $set: {
          status: CurrentStatus.FINAL_SUBMISSION,
        },
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

    await this.passSessionModel.create({
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
