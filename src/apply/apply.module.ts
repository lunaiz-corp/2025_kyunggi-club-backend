import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { ApplyController } from './apply.controller'
import { ApplyService } from './apply.service'

@Module({
  imports: [HttpModule],
  controllers: [ApplyController],
  providers: [ApplyService],
})
export class ApplyModule {}
