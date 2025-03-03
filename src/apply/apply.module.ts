import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  StudentEntity,
  ParentEntity,
  FormRawAnswerEntity,
  FormAnswerEntity,
  ApplyStatusEntity,
  ApplyEntity,
} from 'src/common/repository/entity/apply.entity'

import { ApplyController } from './apply.controller'
import { ApplyService } from './apply.service'

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      StudentEntity,
      ParentEntity,
      FormRawAnswerEntity,
      FormAnswerEntity,
      ApplyStatusEntity,
      ApplyEntity,
    ]),
  ],
  controllers: [ApplyController],
  providers: [ApplyService],
})
export class ApplyModule {}
