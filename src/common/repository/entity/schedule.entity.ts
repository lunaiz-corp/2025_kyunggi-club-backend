import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum ScheduleCategory {
  // 운영 일정
  OPERATION_START = 'OPERATION_START',
  OPERATION_PRESTART = 'OPERATION_PRESTART',
  OPERATION_MAINTENANCE_START = 'OPERATION_MAINTENANCE_START',
  OPERATION_MAINTENANCE_END = 'OPERATION_MAINTENANCE_END',

  // 모집 일정
  APPLICATION_START = 'APPLICATION_START',
  APPLICATION_END = 'APPLICATION_END',

  ETC = 'ETC',
}

@Entity({ name: 'schedule' })
export class ScheduleEntity extends BaseEntity {
  @ApiProperty({ type: String })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ type: () => ScheduleCategory })
  category: ScheduleCategory

  @ApiProperty({ type: Date })
  @Column({ type: 'timestamp' })
  start_at: Date

  @ApiProperty({ type: Date })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date
}
