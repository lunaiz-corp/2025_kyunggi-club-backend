import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { MongooseModule } from '@nestjs/mongoose'

import { Apply, ApplySchema } from 'src/common/repository/schema/apply.schema'
import {
  PassSession,
  PassSessionSchema,
} from 'src/common/repository/schema/pass.schema'

import { ApplyController } from './apply.controller'
import { ApplyService } from './apply.service'

import { RolesService } from 'src/auth/roles.service'

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Apply.name, schema: ApplySchema },
      { name: PassSession.name, schema: PassSessionSchema },
    ]),
  ],
  controllers: [ApplyController],
  providers: [ApplyService, RolesService],
})
export class ApplyModule {}
