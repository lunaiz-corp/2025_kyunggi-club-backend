import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity, Entity, PrimaryColumn } from 'typeorm'

export enum ServiceStatus {
  OPEN = 'OPEN',
  QA = 'QA',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity({ name: 'status' })
export class StatusEntity extends BaseEntity {
  @ApiProperty({ type: () => Object.values(ServiceStatus) })
  @PrimaryColumn({ type: 'text', enum: Object.values(ServiceStatus) })
  status: ServiceStatus
}
