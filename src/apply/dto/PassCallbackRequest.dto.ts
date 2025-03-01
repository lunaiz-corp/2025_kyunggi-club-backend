export class PassCallbackRequestDto {
  /**
   * 결과 코드
   * @example "0000"
   */
  res_cd: string

  /**
   * 결과 메시지
   * @example "정상처리"
   */
  res_msg: string

  /**
   * 요청 종류 구분
   * @example "otp_auth"
   */
  req_tx: string

  /**
   * 본인확인 고유한 인증 거래번호
   * @example 20220913123456
   */
  cert_no: string

  /**
   * PASS 본인인증 요청 ID
   * @example KGH20220913123456@abcdefghij
   */
  ordr_idxx: string

  /**
   * 개인정보 암호화값
   * @example .1.C73CFBAEFE2E9B89DFCEFA16E9607D0
   */
  enc_cert_data2: string

  /**
   * 요청 hash data
   * @example "B57CFD6CB4ADAEE...F6002066B1"
   */
  up_hash: string

  /**
   * 응답데이터 검증 해쉬
   * @example 93B83739C223DSSA93809D483920323A43C3893182
   */
  dn_hash: string
}

export default PassCallbackRequestDto
