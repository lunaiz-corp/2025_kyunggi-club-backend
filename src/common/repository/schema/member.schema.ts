import { ApiProperty } from '@nestjs/swagger'

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

import { Club } from './club.schema'

export enum MemberPermission {
  // 최고 관리자 (운영팀)
  SUPER_ADMIN = 'SUPER_ADMIN',

  // 동아리 관리자
  ADMIN = 'ADMIN',
}

export enum MemberRole {
  // 운영팀
  OWNER = 'OWNER',

  // 동아리 부장
  CLUB_LEADER = 'CLUB_LEADER',
  // 차장
  CLUB_DEPUTY = 'CLUB_DEPUTY',
  // 총무 및 그 이하
  CLUB_MEMBER = 'CLUB_MEMBER',
}

@Schema()
export class Member {
  @ApiProperty({ type: String })
  @Prop({ required: true, unique: true, type: String })
  email: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  name: string

  @ApiProperty({ type: String })
  @Prop({ required: true, type: String })
  phone: string

  @ApiProperty({ type: String, required: false })
  @Prop({ required: false, type: String })
  password?: string

  @ApiProperty({ type: () => Object.values(MemberRole) })
  @Prop({ required: true, enum: Object.values(MemberRole) })
  role: MemberRole

  @ApiProperty({ type: () => Object.values(MemberPermission) })
  @Prop({ required: true, enum: Object.values(MemberPermission) })
  permission: MemberPermission

  @ApiProperty({ type: () => Club })
  @Prop({ type: [{ required: true, type: String, ref: 'Club' }] })
  club: Club[]

  @ApiProperty({ type: Date })
  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date
}

export type MemberDocument = HydratedDocument<Member>

export const MemberSchema = SchemaFactory.createForClass(Member)
