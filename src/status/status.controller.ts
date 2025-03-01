import { Body, Controller, Get, Logger, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ServiceStatus } from 'src/common/repository/entity/status.entity'

import { StatusService } from './status.service'
import StatusMutateRequestDto from './dto/StatusMutateRequest.dto'

@ApiTags('Status - 운영 상태 관리 API')
@Controller('status')
export class StatusController {
  private readonly logger = new Logger(StatusController.name)

  constructor(private readonly serviceStatus: StatusService) {}

  @Get('')
  @ApiOperation({
    summary: '운영 상태 조회',
    description: '운영 상태를 조회합니다.',
  })
  async retrieveServiceStatus(): Promise<ServiceStatus> {
    return this.serviceStatus.retrieveServiceStatus()
  }

  @Patch('')
  @ApiOperation({
    summary: '(ADMIN) 운영 상태 수정',
    description: '운영 상태를 수정합니다.',
  })
  async updateServiceStatus(@Body() data: StatusMutateRequestDto) {
    await this.serviceStatus.updateServiceStatus(data.status)
  }
}
