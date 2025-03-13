import { ScheduleCategory } from 'src/common/repository/schema/schedule.schema'

export class ScheduleMutateRequestDto {
  /**
   * 스케쥴 제목
   * @example '스케쥴 제목'
   */
  title: string

  /**
   * 스케쥴 타입
   * @example 'OPERATION_START'
   */

  category: ScheduleCategory

  /**
   * 스케쥴 일정
   * @example '2021-01-01T00:00:00.000Z'
   */
  timestamp: Date
}

export default ScheduleMutateRequestDto
