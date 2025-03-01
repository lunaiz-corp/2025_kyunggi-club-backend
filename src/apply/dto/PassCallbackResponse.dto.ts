export class PassCallbackResponseDto {
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
   * 명의자명
   * @example "홍길동"
   */
  user_name: string

  /**
   * 본인확인 휴대폰 번호
   * @example "01012345678"
   */
  phone_no: string

  /**
   * 명의자가 자녀 대신 인증 한 경우 (최소 25세인 경우)
   * @example false
   */
  is_parent: boolean
}

export default PassCallbackResponseDto
