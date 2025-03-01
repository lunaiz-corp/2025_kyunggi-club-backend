import { ServiceStatus } from 'src/common/repository/entity/status.entity'

export class StatusMutateRequestDto {
  /**
   * 운영 상태
   * @example 'OPEN'
   */

  status: ServiceStatus
}

export default StatusMutateRequestDto
