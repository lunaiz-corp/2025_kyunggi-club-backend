import { Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult } from 'typeorm'

import {
  ServiceStatus,
  StatusEntity,
} from 'src/common/repository/entity/status.entity'

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
  ) {}

  async retrieveServiceStatus(): Promise<StatusEntity> {
    const cachedStatus = await this.cacheManager.get<StatusEntity>('status')

    if (cachedStatus) {
      return cachedStatus
    }

    let status = (await this.statusRepository.find())[0]

    if (!status) {
      await this.statusRepository.save({ status: ServiceStatus.OPEN })
      status = (await this.statusRepository.find())[0]
    }

    await this.cacheManager.set('status', status, 1800 * 1000)
    return status
  }

  async updateServiceStatus(data: StatusEntity): Promise<UpdateResult> {
    await this.cacheManager.del('status')
    return this.statusRepository.update({}, { status: data.status })
  }
}
