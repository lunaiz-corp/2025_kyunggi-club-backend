import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StatusEntity } from 'src/common/repository/entity/status.entity'

import { StatusController } from './status.controller'
import { StatusService } from './status.service'

@Module({
  imports: [TypeOrmModule.forFeature([StatusEntity])],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
