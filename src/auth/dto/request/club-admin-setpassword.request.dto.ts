export class ClubAdminSetpasswordRequestDto {
  /**
   * 비밀번호 설정 요청 Pincode (랜덤 6글자 문자열,)
   * @example 'a1b2c3'
   */
  pincode: string

  /**
   * 설정할 비밀번호
   * @example 'strong_password'
   */
  password: string
}

export default ClubAdminSetpasswordRequestDto
