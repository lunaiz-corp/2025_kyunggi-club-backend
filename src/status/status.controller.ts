import { Body, Controller, Get, Logger, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { StatusEntity } from 'src/common/repository/entity/status.entity'
import { AuthGuard } from 'src/auth/auth.guard'

import { StatusService } from './status.service'

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
  async retrieveServiceStatus(): Promise<StatusEntity> {
    return await this.serviceStatus.retrieveServiceStatus()
  }

  @Patch('')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 운영 상태 수정',
    description: '운영 상태를 수정합니다.',
  })
  @ApiBearerAuth()
  async updateServiceStatus(@Body() data: StatusEntity) {
    await this.serviceStatus.updateServiceStatus(data)
  }
}
