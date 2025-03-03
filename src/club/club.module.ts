import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'

import { ClubController } from './club.controller'
import { ClubService } from './club.service'

@Module({
  imports: [TypeOrmModule.forFeature([ClubEntity, ClubTemplateEntity])],
  controllers: [ClubController],
  providers: [ClubService],
})
export class ClubModule {}
