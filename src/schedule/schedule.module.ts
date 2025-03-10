import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ScheduleEntity } from 'src/common/repository/entity/schedule.entity'

import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'
import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntity])],
  controllers: [ScheduleController],
  providers: [ScheduleService, RolesService],
})
export class ScheduleModule {}
