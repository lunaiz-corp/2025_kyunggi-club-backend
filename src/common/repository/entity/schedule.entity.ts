import { ApiProperty } from '@nestjs/swagger'
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { ClubEntity } from './club.entity'

export enum ScheduleCategory {
  // 모집 일정
  APPLICATION_START = 'APPLICATION_START',
  APPLICATION_END = 'APPLICATION_END',

  // 지필 일정
  EXAMINATION = 'EXAMINATION',

  // 면접 일정
  INTERVIEW = 'INTERVIEW',

  ETC = 'ETC',
}

export enum OperationScheduleCategory {
  // 운영 일정
  OPERATION_START = 'OPERATION_START',
  OPERATION_PRESTART = 'OPERATION_PRESTART',
  OPERATION_MAINTENANCE_START = 'OPERATION_MAINTENANCE_START',
  OPERATION_MAINTENANCE_END = 'OPERATION_MAINTENANCE_END',
}

@Entity({ name: 'schedule' })
export class ScheduleEntity extends BaseEntity {
  @ApiProperty({
    type: String,
    example: 'b1e7dea0-2060-4f0a-835a-a51636fa1926',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ type: String, example: '스케쥴 제목' })
  @Column({ type: 'text' })
  title: string

  @ApiProperty({ type: () => Object.values(ScheduleCategory) })
  @Column({ type: 'text', enum: Object.values(ScheduleCategory) })
  category: ScheduleCategory

  @ApiProperty({ type: () => ClubEntity, required: false })
  @ManyToOne(() => ClubEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'club_id', referencedColumnName: 'id' })
  club: ClubEntity

  @ApiProperty({ type: Date })
  @Column({ type: 'timestamp with time zone' })
  start_at: Date

  @ApiProperty({ type: Date })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date
}

@Entity({ name: 'operation_schedule' })
export class OperationScheduleEntity extends BaseEntity {
  @ApiProperty({
    type: String,
    example: 'b1e7dea0-2060-4f0a-835a-a51636fa1926',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ type: String, example: '스케쥴 제목' })
  @Column({ type: 'text' })
  title: string

  @ApiProperty({ type: () => Object.values(OperationScheduleCategory) })
  @Column({ type: 'text', enum: Object.values(OperationScheduleCategory) })
  category: OperationScheduleCategory

  @ApiProperty({ type: Date })
  @Column({ type: 'timestamp with time zone' })
  start_at: Date

  @ApiProperty({ type: Date })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date
}
