import {
  CurrentStatus,
  FormAnswerEntity,
  StudentEntity,
} from 'src/common/repository/entity/apply.entity'
import { ClubEntity } from 'src/common/repository/entity/club.entity'

export class ApplicationStatusRetrieveResponseDto {
  /**
   * 학생 정보 Object
   */
  userInfo: StudentEntity

  /**
   * 지원한 동아리 목록
   */
  applingClubs: string[]

  /**
   * 지원한 동아리의 상태
   */
  currentStatus: {
    club: ClubEntity
    status: CurrentStatus
  }[]

  /**
   * 지원서 응답
   */
  formAnswers: {
    club: ClubEntity
    answers: FormAnswerEntity[]
  }[]
}

export default ApplicationStatusRetrieveResponseDto
