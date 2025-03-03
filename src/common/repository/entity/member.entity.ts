import { ApiProperty } from '@nestjs/swagger'

import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

import { ClubEntity } from './club.entity'

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

@Entity({ name: 'member' })
export class MemberEntity extends BaseEntity {
  @ApiProperty({ type: String })
  @PrimaryColumn({ type: 'text' })
  email: string

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  name: string

  @ApiProperty({ type: String })
  @PrimaryColumn({ type: 'text' })
  phone: string

  @ApiProperty({ type: String, required: false })
  @Column({ type: 'text', nullable: true })
  password?: string

  @ApiProperty({ type: () => Object.values(MemberRole) })
  @Column({ type: 'text' })
  role: MemberRole

  @ApiProperty({ type: () => Object.values(MemberPermission) })
  @Column({ type: 'text' })
  permission: MemberPermission

  @ApiProperty({ type: () => ClubEntity })
  @ManyToOne(() => ClubEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'club_id', referencedColumnName: 'id' })
  club: ClubEntity

  @ApiProperty({ type: Date })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date
}
