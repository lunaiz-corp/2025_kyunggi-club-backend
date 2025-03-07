import { HttpStatus, Injectable, Logger } from '@nestjs/common'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult } from 'typeorm'

import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

import {
  ScheduleEntity,
  OperationScheduleEntity,
  ScheduleCategory,
  OperationScheduleCategory,
} from 'src/common/repository/entity/schedule.entity'

import {
  ScheduleMutateRequestDto,
  OperationScheduleMutateRequestDto,
} from './dto/request/schedule-mutate.request.dto'

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name)

  private readonly types = {
    OPERATION: new Set([
      OperationScheduleCategory.OPERATION_START,
      OperationScheduleCategory.OPERATION_PRESTART,
      OperationScheduleCategory.OPERATION_MAINTENANCE_START,
      OperationScheduleCategory.OPERATION_MAINTENANCE_END,
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

    @InjectRepository(OperationScheduleEntity)
    private readonly operationScheduleRepository: Repository<OperationScheduleEntity>,
  ) {}

  async retrieveSchedulesList(
    type?: string,
    club?: string,
  ): Promise<
    (
      | ScheduleEntity
      | OperationScheduleEntity
      | (ScheduleEntity & OperationScheduleEntity)
    )[]
  > {
    const allowedCategory = this.types?.[type.toUpperCase()]

    if (type === 'OPERATION') {
      const schedules = await this.operationScheduleRepository.find()

      return schedules.filter((schedule) => {
        return type ? allowedCategory.has(schedule.category) : true
      })
    } else if (type) {
      const schedules = await this.scheduleRepository.find({
        where: club ? { club: { id: club } } : {},
      })

      return schedules.filter((schedule) => {
        return type ? allowedCategory.has(schedule.category) : true
      })
    } else {
      const normalSchedules = await this.scheduleRepository.find({
        where: club ? { club: { id: club } } : {},
      })

      const operationSchedules = await this.operationScheduleRepository.find()

      return [...normalSchedules, ...operationSchedules]
    }
  }

  async createSchedule(
    data: ScheduleMutateRequestDto,
  ): Promise<ScheduleEntity | OperationScheduleEntity> {
    return this.scheduleRepository.save({
      ...data,
      club: { id: data.club },
    })
  }

  async createOperationSchedule(
    data: OperationScheduleMutateRequestDto,
  ): Promise<ScheduleEntity | OperationScheduleEntity> {
    return this.operationScheduleRepository.save(data)
  }

  async updateSchedule(
    id: string,
    data: ScheduleMutateRequestDto | OperationScheduleMutateRequestDto,
  ): Promise<UpdateResult> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['club'],
    })
    if (schedule) {
      if (!this.rolesService.canActivate([schedule.club.id])) {
        throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
      }

      return this.scheduleRepository.update(id, {
        ...(data as ScheduleMutateRequestDto),
        club: { id: (data as ScheduleMutateRequestDto).club },
      })
    }

    const operationSchedule = await this.operationScheduleRepository.findOne({
      where: { id },
    })
    if (operationSchedule) {
      if (!this.rolesService.canRootActivate()) {
        throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
      }

      return this.operationScheduleRepository.update(
        id,
        data as OperationScheduleMutateRequestDto,
      )
    }
  }

  async deleteSchedule(id: string): Promise<DeleteResult> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['club'],
    })
    if (schedule) {
      if (!this.rolesService.canActivate([schedule.club.id])) {
        throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
      }

      return this.scheduleRepository.delete(id)
    }

    const operationSchedule = await this.operationScheduleRepository.findOne({
      where: { id },
    })
    if (operationSchedule) {
      if (!this.rolesService.canRootActivate()) {
        throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
      }

      return this.operationScheduleRepository.delete(id)
    }
  }
}
