import { CurrentStatus } from 'src/common/repository/schema/apply.schema'

export class ApplicationStatusMutateRequestDto {
  status: CurrentStatus
}

export class ApplicationStatusBulkMutateRequestDto extends ApplicationStatusMutateRequestDto {
  ids: string[]
}

export default ApplicationStatusMutateRequestDto
