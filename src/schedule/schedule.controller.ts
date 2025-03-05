import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { ScheduleEntity } from 'src/common/repository/entity/schedule.entity'
import { AuthGuard } from 'src/auth/auth.guard'

import { ScheduleService } from './schedule.service'
import ScheduleMutateRequestDto from './dto/request/schedule-mutate.request.dto'

import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

@ApiTags('Schedule - 일정 관리 API')
@Controller('schedule')
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name)

  constructor(
    private readonly rolesService: RolesService,

    private readonly scheduleService: ScheduleService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: '모든 일정 조회',
    description: '모든 일정을 조회합니다.',
  })
  async retrieveSchedulesList(): Promise<ScheduleEntity[]> {
    return await this.scheduleService.retrieveSchedulesList()
  }

  @Put('')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 일정 추가',
    description: '새로운 일정을 추가합니다.',
  })
  @ApiBearerAuth()
  async createSchedule(@Body() data: ScheduleMutateRequestDto) {
    if (!this.rolesService.canActivate([data.club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.scheduleService.createSchedule(data)
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 일정 수정',
    description: '일정을 수정합니다.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 'b1e7dea0-2060-4f0a-835a-a51636fa1926' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() data: ScheduleMutateRequestDto,
  ) {
    if (!this.rolesService.canActivate([data.club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.scheduleService.updateSchedule(id, data)
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 일정 삭제',
    description: '일정을 삭제합니다.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', example: 'b1e7dea0-2060-4f0a-835a-a51636fa1926' })
  async deleteSchedule(@Param('id') id: string) {
    // 권한 관리 로직: service 안에 들어있음
    await this.scheduleService.deleteSchedule(id)
  }
}
