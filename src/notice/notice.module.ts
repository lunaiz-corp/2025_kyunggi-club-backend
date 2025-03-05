import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { NoticeEntity } from 'src/common/repository/entity/notice.entity'

import { NoticeController } from './notice.controller'
import { NoticeService } from './notice.service'

import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity])],
  controllers: [NoticeController],
  providers: [NoticeService, RolesService],
})
export class NoticeModule {}
