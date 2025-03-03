import {
  ScheduleCategory,
  OperationScheduleCategory,
} from 'src/common/repository/entity/schedule.entity'

export class ScheduleMutateRequestDto {
  /**
   * 스케쥴 제목
   * @example '스케쥴 제목'
   */
  title: string

  /**
   * 스케쥴 타입
   * @example 'APPLICATION_START'
   */

  category: ScheduleCategory

  /**
   * 대상 동아리
   * @example 'list'
   */

  club: string

  /**
   * 스케쥴 일정
   * @example '2021-01-01T00:00:00.000Z'
   */
  timestamp: Date
}

export class OperationScheduleMutateRequestDto {
  /**
   * 스케쥴 제목
   * @example '스케쥴 제목'
   */
  title: string

  /**
   * 스케쥴 타입
   * @example 'OPERATION_START'
   */

  category: OperationScheduleCategory

  /**
   * 스케쥴 일정
   * @example '2021-01-01T00:00:00.000Z'
   */
  timestamp: Date
}

export default ScheduleMutateRequestDto
