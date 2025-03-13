import { CurrentStatus } from 'src/common/repository/schema/apply.schema'

export class ApplicationStatusMutateRequestDto {
  status: CurrentStatus
}

export class ApplicationStatusBulkMutateRequestDto {
  ids: number[]
  status: 'PASSED' | 'REJECTED'
}

export default ApplicationStatusMutateRequestDto
