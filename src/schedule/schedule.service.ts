import { HttpStatus, Injectable, Logger } from '@nestjs/common'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult, InsertResult } from 'typeorm'

import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

import {
  ScheduleEntity,
  ScheduleCategory,
} from 'src/common/repository/entity/schedule.entity'

import ScheduleMutateRequestDto from './dto/request/schedule-mutate.request.dto'

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

    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
  ) {}

  async retrieveSchedulesList(type?: string): Promise<ScheduleEntity[]> {
    const allowedCategory = this.types?.[type.toUpperCase()]

    const schedules = await this.scheduleRepository.find()

    return schedules.filter((schedule) => {
      return type ? allowedCategory.has(schedule.category) : true
    })
  }

  async createSchedule(data: ScheduleMutateRequestDto): Promise<InsertResult> {
    return this.scheduleRepository.insert(data)
  }

  async updateSchedule(
    id: string,
    data: ScheduleMutateRequestDto,
  ): Promise<UpdateResult> {
    if (!this.rolesService.canRootActivate()) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id },
    })

    if (!schedule) {
      throw new APIException(HttpStatus.NOT_FOUND, '일정을 찾을 수 없습니다.')
    }

    return this.scheduleRepository.update(id, {
      ...data,
    })
  }

  async deleteSchedule(id: string): Promise<DeleteResult> {
    if (!this.rolesService.canRootActivate()) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id },
    })

    if (!schedule) {
      throw new APIException(HttpStatus.NOT_FOUND, '일정을 찾을 수 없습니다.')
    }

    return this.scheduleRepository.delete(id)
  }
}
