import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  StudentEntity,
  ParentEntity,
  FormAnswerEntity,
  ApplyEntity,
} from 'src/common/repository/entity/apply.entity'

import { ApplyController } from './apply.controller'
import { ApplyService } from './apply.service'

import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      StudentEntity,
      ParentEntity,
      FormAnswerEntity,
      ApplyEntity,
    ]),
  ],
  controllers: [ApplyController],
  providers: [ApplyService, RolesService],
})
export class ApplyModule {}
