import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult } from 'typeorm'

import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

import {
  ScheduleEntity,
  OperationScheduleEntity,
} from 'src/common/repository/entity/schedule.entity'

import ScheduleMutateRequestDto, {
  OperationScheduleMutateRequestDto,
} from './dto/request/schedule-mutate.request.dto'

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name)

  constructor(
    private readonly rolesService: RolesService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,

    @InjectRepository(OperationScheduleEntity)
    private readonly operationScheduleRepository: Repository<OperationScheduleEntity>,
  ) {}

  async retrieveSchedulesList(): Promise<ScheduleEntity[]> {
    const cachedSchedules =
      await this.cacheManager.get<ScheduleEntity[]>('schedule')

    if (cachedSchedules) {
      return cachedSchedules
    }

    const schedules = await this.scheduleRepository.find()
    await this.cacheManager.set('schedule', schedules, 1800 * 1000)

    return schedules
  }

  async createSchedule(
    data: ScheduleMutateRequestDto | OperationScheduleMutateRequestDto,
  ): Promise<ScheduleEntity | OperationScheduleEntity> {
    await this.cacheManager.del('schedule')

    if (data instanceof OperationScheduleMutateRequestDto) {
      return this.operationScheduleRepository.save(data)
    }

    return this.scheduleRepository.save({
      ...data,
      club: { id: data.club },
    })
  }

  async updateSchedule(
    id: string,
    data: ScheduleMutateRequestDto | OperationScheduleMutateRequestDto,
  ): Promise<UpdateResult> {
    await this.cacheManager.del('schedule')

    if (data instanceof OperationScheduleMutateRequestDto) {
      return this.operationScheduleRepository.update(id, data)
    }

    return this.scheduleRepository.update(id, {
      ...data,
      club: { id: data.club },
    })
  }

  async deleteSchedule(id: string): Promise<DeleteResult> {
    await this.cacheManager.del('schedule')

    const schedule = await this.scheduleRepository.findOne({ where: { id } })
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
