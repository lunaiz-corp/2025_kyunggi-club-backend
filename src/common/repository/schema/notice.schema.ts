import { ApiProperty } from '@nestjs/swagger'

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

@Schema()
export class NoticeCategory {
  @ApiProperty({ type: String })
  @Prop({ required: true, unique: true, type: String })
  id: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  name: string
}

@Schema()
export class Notice {
  @ApiProperty({ type: Number })
  // @PrimaryGeneratedColumn({ type: 'bigint' })
  @Prop({ required: true, unique: true, type: Number })
  id: number

  @ApiProperty({ type: () => NoticeCategory })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'NoticeCategory' })
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
export type NoticeCategoryDocument = HydratedDocument<NoticeCategory>

export const NoticeSchema = SchemaFactory.createForClass(Notice)
export const NoticeCategorySchema = SchemaFactory.createForClass(NoticeCategory)
