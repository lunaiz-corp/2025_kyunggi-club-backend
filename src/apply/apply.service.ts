import { Inject, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

import { IPassHashData, IPassVerifyResult } from 'src/common/types/pass'

import fs from 'node:fs'
import crypto from 'node:crypto'

import { firstValueFrom } from 'rxjs'
import { Cache } from 'cache-manager'

import { APIException } from 'src/common/dto/APIException.dto'

@Injectable()
export class ApplyService {
  private readonly logger = new Logger(ApplyService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getPassHashData(orderId: string): Promise<IPassHashData> {
    const cachedHashData = await this.cacheManager.get<IPassHashData>(
      `pass-hashdata:${orderId}`,
    )

    if (cachedHashData) {
      return cachedHashData
    }

    const orderIdRegex = /^KGH\d{14}@\w{10}$/
    if (!orderId || !orderIdRegex.test(orderId)) {
      throw new APIException(400, '잘못된 orderId 형식입니다.')
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
      resCd: data.res_cd,
      resMsg: data.res_msg,

      webSiteId: data.res_cd === '0000' ? '' : undefined,
      siteCd: data.res_cd === '0000' ? process.env.KCP_API_SITECD : undefined,

      callbackUrl: `${
        data.res_cd === '0000' && process.env.NODE_ENV === 'development'
          ? 'http://localhost:4000'
          : 'https://api.kyunggi.club'
      }/apply/pass/decrypt`,
      webSiteIdHashYN: data.res_cd === '0000' ? '' : undefined,

      orderId: data.res_cd === '0000' ? orderId : undefined,
      upHash: data.res_cd === '0000' ? data.up_hash : undefined,

      kcpCertLibVer: data.res_cd === '0000' ? data.kcp_cert_lib_ver : undefined,
      kcpWindowUrl: `${process.env.KCP_WD_BASEURL}/kcp_cert/cert_view.jsp`,
      kcpMerchantTime:
        data.res_cd === '0000' ? data.kcp_merchant_time : undefined,
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
  ): Promise<IPassVerifyResult> {
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

    this.logger.debug(`[KCP Request] => ${process.env.KCP_API_BASEURL}`, {
      kcp_cert_info: this.passSerializedCert('public'),
      site_cd: process.env.KCP_API_SITECD,
      ordr_idxx: orderId,
      ct_type: decryptCtType,
      cert_no: data.certNo,
      enc_cert_Data: data.certData,
      kcp_sign_data: decryptSignatureData,
    })

    this.logger.debug(
      `[KCP Response] => ${process.env.KCP_API_BASEURL}`,
      decryptedData,
    )

    return {
      resCd: decryptedData.res_cd,
      resMsg: decryptedData.res_msg,
      commId:
        decryptedData.res_cd === '0000' ? decryptedData.comm_id : undefined,
      phoneNo:
        decryptedData.res_cd === '0000' ? decryptedData.phone_no : undefined,
      userName:
        decryptedData.res_cd === '0000' ? decryptedData.user_name : undefined,
      birthDay:
        decryptedData.res_cd === '0000' ? decryptedData.birth_day : undefined,
      sex:
        decryptedData.res_cd === '0000'
          ? decryptedData.sex_code === '01'
            ? 'M'
            : 'F'
          : undefined,
      nation:
        decryptedData.res_cd === '0000'
          ? decryptedData.nation_code === '01'
            ? 'KR'
            : 'ETC'
          : undefined,
      di: decryptedData.res_cd === '0000' ? decryptedData.di_url : undefined,
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
