export class ApplicationStatusRetrieveRequestDto {
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
}

export default ApplicationStatusRetrieveRequestDto
