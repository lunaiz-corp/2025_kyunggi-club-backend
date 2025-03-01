import { Inject, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

import fs from 'node:fs'
import crypto from 'node:crypto'

import { firstValueFrom } from 'rxjs'
import { Cache } from 'cache-manager'

import APIException from 'src/common/dto/APIException.dto'
import PassHashResponseDto from './dto/PassHashResponse.dto'
import PassCallbackResponseDto from './dto/PassCallbackResponse.dto'

@Injectable()
export class ApplyService {
  private readonly logger = new Logger(ApplyService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

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
      throw new APIException(400, '잘못된 orderId 형식입니다.')
    }

    if (!device || !['pc', 'android', 'ios'].includes(device)) {
      throw new APIException(400, '잘못된 device 형식입니다.')
    }

    const ctType = 'HAS'
    const taxNo = '000000'

    const formattedTime = new Date()
      .toISOString()
      .slice(2)
      .replace(/[-T:]/g, '')
      .split('.')[0]

    const signatureData = this.passSignatureData(
      `${process.env.KCP_API_SITECD}^${ctType}^${taxNo}^${formattedTime}`,
    )

    const { data } = await firstValueFrom(
      this.httpService.post(process.env.KCP_API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: process.env.KCP_API_SITECD,
        ordr_idxx: orderId,
        ct_type: ctType,
        web_siteid: '',
        tax_no: taxNo,
        make_req_dt: formattedTime,
        kcp_sign_data: signatureData,
      }),
    )

    this.logger.debug(`[KCP Request] => ${process.env.KCP_API_BASEURL}`, {
      kcp_cert_info: this.passSerializedCert('public'),
      site_cd: process.env.KCP_API_SITECD,
      ordr_idxx: orderId,
      ct_type: ctType,
      web_siteid: '',
      tax_no: taxNo,
      make_req_dt: formattedTime,
      kcp_sign_data: signatureData,
    })

    this.logger.debug(`[KCP Response] => ${process.env.KCP_API_BASEURL}`, data)

    const passReqData = {
      data: {
        // 결과 코드
        res_cd: data.res_cd,

        // 결과 메시지
        res_msg: data.res_msg,
      },
      url:
        data.res_cd === '0000'
          ? `${process.env.KCP_WD_BASEURL}/kcp_cert/cert_view.jsp`
          : undefined,
      formData:
        data.res_cd === '0000'
          ? {
              // 사이트 코드
              site_cd: process.env.KCP_API_SITECD,

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
                  ? 'http://macbook:4000'
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
      `${process.env.KCP_API_SITECD}^${verifyCtType}^${data.certNo}^${data.dnHash}`,
    )

    const { data: dnHashVerify } = await firstValueFrom(
      this.httpService.post(process.env.KCP_API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: process.env.KCP_API_SITECD,
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
      `${process.env.KCP_API_SITECD}^${decryptCtType}^${data.certNo}`,
    )

    this.logger.debug(`[KCP Request] => ${process.env.KCP_API_BASEURL}`, {
      kcp_cert_info: this.passSerializedCert('public'),
      site_cd: process.env.KCP_API_SITECD,
      ordr_idxx: orderId,
      ct_type: decryptCtType,
      cert_no: data.certNo,
      enc_cert_Data: data.certData,
      kcp_sign_data: decryptSignatureData,
    })

    const { data: decryptedData } = await firstValueFrom(
      this.httpService.post(process.env.KCP_API_BASEURL, {
        kcp_cert_info: this.passSerializedCert('public'),
        site_cd: process.env.KCP_API_SITECD,
        ordr_idxx: orderId,
        ct_type: decryptCtType,
        cert_no: data.certNo,
        enc_cert_Data: data.certData,
        kcp_sign_data: decryptSignatureData,
      }),
    )

    this.logger.debug(
      `[KCP Response] => ${process.env.KCP_API_BASEURL}`,
      decryptedData,
    )

    await this.cacheManager.get(`pass-hashdata:${orderId}`)

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
