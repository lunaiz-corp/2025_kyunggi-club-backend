export class RegisterCiDiRequestDto {
  /**
   * 지원자 이름
   * @example '홍길동'
   */
  studentName: string

  /**
   * 발급받은 지원서 고유 패스워드
   * @example 'a1b2c3'
   */
  password: string

  /**
   * 전화번호, CI 등을 서버에서 참조할 수 있는 refId
   */
  verifiedRefId: string
}

export default RegisterCiDiRequestDto
