import { ApiProperty } from '@nestjs/swagger'

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export enum ScheduleCategory {
  // 운영 일정
  OPERATION_START = 'OPERATION_START',
  OPERATION_PRESTART = 'OPERATION_PRESTART',
  OPERATION_MAINTENANCE_START = 'OPERATION_MAINTENANCE_START',
  OPERATION_MAINTENANCE_END = 'OPERATION_MAINTENANCE_END',

  // 모집 일정
  APPLICATION_START = 'APPLICATION_START',
  APPLICATION_END = 'APPLICATION_END',

  // 지필 일정
  EXAMINATION = 'EXAMINATION',

  // 면접 일정
  INTERVIEW = 'INTERVIEW',

  ETC = 'ETC',
}

@Schema()
export class Schedule {
  @ApiProperty({ type: String, example: '스케쥴 제목' })
  @Prop({ required: true, type: String })
  title: string

  @ApiProperty({ type: () => Object.values(ScheduleCategory) })
  @Prop({ required: true, enum: Object.values(ScheduleCategory) })
  category: ScheduleCategory

  @ApiProperty({ type: Date })
  @Prop({ required: true, type: Date })
  startAt: Date

  @ApiProperty({ type: Date })
  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date
}

export type ScheduleDocument = HydratedDocument<Schedule>
export const ScheduleSchema = SchemaFactory.createForClass(Schedule)
