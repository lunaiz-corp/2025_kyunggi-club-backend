import { Controller, Get, Patch, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Schedule - 일정 관리 API')
@Controller('schedule')
export class ScheduleController {
  @Get('')
  @ApiOperation({
    summary: '모든 일정 조회',
    description: '모든 일정을 조회합니다.',
  })
  async retrieveSchedules() {
    return
  }

  @Put('')
  @ApiOperation({
    summary: '(ADMIN) 일정 추가',
    description: '새로운 일정을 추가합니다.',
  })
  async createSchedule() {
    return
  }

  @Patch(':id')
  @ApiOperation({
    summary: '(ADMIN) 일정 수정',
    description: '일정을 수정합니다.',
  })
  async updateSchedule() {
    return
  }
}
