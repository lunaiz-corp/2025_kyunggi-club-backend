import { Module } from '@nestjs/common'

import {
  Schedule,
  ScheduleSchema,
} from 'src/common/repository/schema/schedule.schema'

import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'
import { RolesService } from 'src/auth/roles.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, RolesService],
})
export class ScheduleModule {}
