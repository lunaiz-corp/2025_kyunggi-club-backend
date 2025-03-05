import { ApiProperty } from '@nestjs/swagger'
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

import { MemberEntity } from './member.entity'

export enum QuestionType {
  SHORT_INPUT = 'SHORT_INPUT',
  LONG_INPUT = 'LONG_INPUT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DROPDOWN = 'DROPDOWN',
  FILE_UPLOAD = 'FILE_UPLOAD',
}

@Entity({ name: 'club' })
export class ClubEntity extends BaseEntity {
  @ApiProperty({ type: String })
  @PrimaryColumn()
  id: string

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  name: string

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  description: string

  @ManyToMany(() => MemberEntity, (user) => user.club)
  @JoinColumn({ name: 'member_email', referencedColumnName: 'email' })
  members: MemberEntity[]
}

@Entity({ name: 'template' })
export class ClubTemplateEntity extends BaseEntity {
  @ApiProperty({ type: Number })
  @PrimaryColumn()
  id: number

  @ApiProperty({ type: () => ClubEntity, required: false })
  @ManyToOne(() => ClubEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'club_id', referencedColumnName: 'id' })
  club: ClubEntity

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  question: string

  @ApiProperty({ type: () => Object.values(QuestionType) })
  @Column({ type: 'text', enum: Object.values(QuestionType) })
  type: QuestionType

  @ApiProperty({ type: [String], isArray: true, required: false })
  @Column({ type: 'text', array: true, nullable: true })
  options?: string[]

  @ApiProperty({ type: Number, required: false })
  @Column({ nullable: true })
  maxFiles?: number

  @ApiProperty({ type: Boolean })
  @Column()
  required: boolean
}
