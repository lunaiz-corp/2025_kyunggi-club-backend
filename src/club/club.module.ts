import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'
import { MemberEntity } from 'src/common/repository/entity/member.entity'

import { ClubController } from './club.controller'
import { ClubService } from './club.service'
import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ClubEntity, ClubTemplateEntity, MemberEntity]),
  ],
  controllers: [ClubController],
  providers: [ClubService, RolesService],
})
export class ClubModule {}
