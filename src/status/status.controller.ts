import { Controller, Get, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Status - 운영 상태 관리 API')
@Controller('status')
export class StatusController {
  @Get('')
  @ApiOperation({
    summary: '운영 상태 조회',
    description: '운영 상태를 조회합니다.',
  })
  async retrieveServerStatus() {
    return
  }

  @Patch('')
  @ApiOperation({
    summary: '(ADMIN) 운영 상태 수정',
    description: '운영 상태를 수정합니다.',
  })
  async updateServerStatus() {
    return
  }
}
