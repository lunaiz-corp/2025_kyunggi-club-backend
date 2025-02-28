export interface IPassHashData {
  resCd: string
  resMsg: string

  webSiteId?: string
  siteCd?: string
  callbackUrl: string
  webSiteIdHashYN?: string

  orderId?: string
  upHash?: string

  kcpCertLibVer?: string
  kcpWindowUrl: string
  kcpMerchantTime?: string
}

export interface IPassVerifyResult {
  resCd: string
  resMsg: string
  commId?: string
  phoneNo?: string
  userName?: string
  birthDay?: string
  sex?: 'M' | 'F'
  nation?: 'KR' | 'ETC'
  di?: string
}
