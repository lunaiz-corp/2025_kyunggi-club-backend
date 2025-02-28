import { Module } from '@nestjs/common'
import { CdnController } from './cdn.controller'
import { CdnService } from './cdn.service'

@Module({
  controllers: [CdnController],
  providers: [CdnService],
})
export class CdnModule {}
