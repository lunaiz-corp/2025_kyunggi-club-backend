export class SignInRequestDto {
  /**
   * 이메일
   * @example "biz.kyunggi@lunaiz.com"
   */
  email: string

  /**
   * 비밀번호
   * @example "password"
   */
  password: string
}

export default SignInRequestDto
