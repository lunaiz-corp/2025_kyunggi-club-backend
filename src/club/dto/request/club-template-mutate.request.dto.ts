import { ApiProperty } from '@nestjs/swagger'
import { QuestionType } from 'src/common/repository/entity/club.entity'

export class ClubTemplateMutateRequestDto {
  /**
   * 질문지 index
   * @example 1
   */
  id: string

  /**
   * 질문
   * @example "무임승차를 하실건가요?"
   */
  question: string

  /**
   * 질문 타입
   * @example "SHORT_INPUT"
   */
  type: QuestionType

  /**
   * 질문 옵션 (선택형 질문일 경우)
   * @example []
   */
  @ApiProperty({ type: [String], isArray: true, required: false })
  options?: string[]

  /**
   * 최대 파일 개수 (파일 업로드 질문일 경우)
   * @example 10
   */
  @ApiProperty({ type: Number, required: false })
  maxFiles?: number

  /**
   * 필수 여부
   * @example true
   */
  required: boolean
}

export default ClubTemplateMutateRequestDto
