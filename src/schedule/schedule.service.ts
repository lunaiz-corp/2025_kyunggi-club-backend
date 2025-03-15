import { HttpStatus, Injectable, Logger } from '@nestjs/common'

import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

import ScheduleMutateRequestDto from './dto/request/schedule-mutate.request.dto'
import { InjectModel } from '@nestjs/mongoose'
import {
  Schedule,
  ScheduleCategory,
} from 'src/common/repository/schema/schedule.schema'
import { Model } from 'mongoose'

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name)

  private readonly types = {
    OPERATION: new Set([
      ScheduleCategory.OPERATION_START,
      ScheduleCategory.OPERATION_PRESTART,
      ScheduleCategory.OPERATION_MAINTENANCE_START,
      ScheduleCategory.OPERATION_MAINTENANCE_END,
    ]),
    APPLICATION: new Set([
      ScheduleCategory.APPLICATION_START,
      ScheduleCategory.APPLICATION_END,
    ]),
    EXAMINATION: new Set([ScheduleCategory.EXAMINATION]),
    INTERVIEW: new Set([ScheduleCategory.INTERVIEW]),
  }

  constructor(
    private readonly rolesService: RolesService,

    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<Schedule>,
  ) {}

  async retrieveSchedulesList(type?: string): Promise<Schedule[]> {
    const allowedCategory = type
      ? this.types?.[type.toUpperCase()]
      : new Set([
          ScheduleCategory.APPLICATION_START,
          ScheduleCategory.APPLICATION_END,
          ScheduleCategory.EXAMINATION,
          ScheduleCategory.INTERVIEW,
        ])

    return await this.scheduleModel
      .find({
        category: { $in: Array.from(allowedCategory) },
      })
      .sort('-startAt')
      .exec()
  }

  async createSchedule(data: ScheduleMutateRequestDto) {
    await this.scheduleModel.create(data)
  }

  async updateSchedule(id: string, data: ScheduleMutateRequestDto) {
    if (!this.rolesService.canRootActivate()) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    const schedule = await this.scheduleModel.findOne({ id })

    if (!schedule) {
      throw new APIException(HttpStatus.NOT_FOUND, '일정을 찾을 수 없습니다.')
    }

    return this.scheduleModel.updateOne(
      { id },
      {
        ...data,
      },
    )
  }

  async deleteSchedule(id: string) {
    if (!this.rolesService.canRootActivate()) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    const schedule = await this.scheduleModel.findOne({ id })

    if (!schedule) {
      throw new APIException(HttpStatus.NOT_FOUND, '일정을 찾을 수 없습니다.')
    }

    await this.scheduleModel.deleteOne({ id })
  }
}
