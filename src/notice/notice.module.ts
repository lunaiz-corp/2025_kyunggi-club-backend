import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import {
  Notice,
  NoticeSchema,
} from 'src/common/repository/schema/notice.schema'

import { NoticeController } from './notice.controller'
import { NoticeService } from './notice.service'

import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notice.name, schema: NoticeSchema }]),
  ],
  controllers: [NoticeController],
  providers: [NoticeService, RolesService],
})
export class NoticeModule {}
