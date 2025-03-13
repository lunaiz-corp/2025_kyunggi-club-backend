import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import {
  Club,
  ClubSchema,
  ClubTemplate,
  ClubTemplateSchema,
} from 'src/common/repository/schema/club.schema'
import {
  Member,
  MemberSchema,
} from 'src/common/repository/schema/member.schema'

import { ClubController } from './club.controller'
import { ClubService } from './club.service'
import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: ClubTemplate.name, schema: ClubTemplateSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [ClubController],
  providers: [ClubService, RolesService],
})
export class ClubModule {}
