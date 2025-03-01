import { Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult } from 'typeorm'

import { ScheduleEntity } from 'src/common/repository/entity/schedule.entity'

import ScheduleMutateRequestDto from './dto/ScheduleMutateRequest.dto'

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
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
    data: ScheduleMutateRequestDto,
  ): Promise<ScheduleEntity> {
    await this.cacheManager.del('schedule')
    return this.scheduleRepository.save(data)
  }

  async updateSchedule(
    id: string,
    data: ScheduleMutateRequestDto,
  ): Promise<UpdateResult> {
    await this.cacheManager.del('schedule')
    return this.scheduleRepository.update(id, data)
  }

  async deleteSchedule(id: string): Promise<DeleteResult> {
    await this.cacheManager.del('schedule')
    return this.scheduleRepository.delete(id)
  }
}
