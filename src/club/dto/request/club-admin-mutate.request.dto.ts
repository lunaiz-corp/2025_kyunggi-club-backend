import { MemberRole } from 'src/common/repository/schema/member.schema'

export class ClubAdminMutateRequestDto {
  /**
   * 이메일
   * @example "biz.kyunggi@lunaiz.com"
   */
  email: string

  /**
   * 이름
   * @example "홍길동"
   */
  name: string

  /**
   * 전화번호
   * @example "01012345678"
   */
  phone: string

  /**
   * 역할
   * @example "CLUB_LEADER"
   */
  role: MemberRole
}

export default ClubAdminMutateRequestDto
