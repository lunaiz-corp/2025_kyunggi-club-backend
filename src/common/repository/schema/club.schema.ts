import { ApiProperty } from '@nestjs/swagger'

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export enum QuestionType {
  SHORT_INPUT = 'SHORT_INPUT',
  LONG_INPUT = 'LONG_INPUT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DROPDOWN = 'DROPDOWN',
  FILE_UPLOAD = 'FILE_UPLOAD',
}

@Schema()
export class Club {
  @ApiProperty({ type: String })
  @Prop({ required: true, unique: true, type: String })
  id: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  name: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  description: string
}

@Schema()
export class ClubTemplate {
  @ApiProperty({ type: String })
  @Prop({ required: true, unique: true, type: String })
  id: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  club: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  question: string

  @ApiProperty({ type: () => Object.values(QuestionType) })
  @Prop({ required: true, enum: Object.values(QuestionType) })
  type: QuestionType

  @ApiProperty({ type: [String], isArray: true, required: false })
  @Prop({ required: false, type: [String] })
  options?: string[]

  @ApiProperty({ type: Number, required: false })
  @Prop({ required: false, type: Number })
  maxFiles?: number

  @ApiProperty({ type: Boolean })
  @Prop({ required: true, type: Boolean, default: false })
  required: boolean
}

export type ClubDocument = HydratedDocument<Club>
export type ClubTemplateDocument = HydratedDocument<ClubTemplate>

export const ClubSchema = SchemaFactory.createForClass(Club)
export const ClubTemplateSchema = SchemaFactory.createForClass(ClubTemplate)
