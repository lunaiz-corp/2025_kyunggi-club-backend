import { ApiProperty } from '@nestjs/swagger'

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export enum NoticeCategory {
  WWW = 'WWW',
  ADMIN = 'ADMIN',
}

@Schema()
export class Notice {
  @ApiProperty({ type: Number })
  @Prop({ required: true, unique: true, type: Number })
  id: number

  @ApiProperty({ type: () => Object.values(NoticeCategory) })
  @Prop({ required: true, enum: Object.values(NoticeCategory) })
  category: NoticeCategory

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  title: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  content: string

  @ApiProperty({ type: Date })
  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date
}

export type NoticeDocument = HydratedDocument<Notice>

export const NoticeSchema = SchemaFactory.createForClass(Notice)
