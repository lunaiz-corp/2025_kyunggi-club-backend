import { ApiProperty } from '@nestjs/swagger'
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ClubEntity } from './club.entity'

export enum CurrentStatus {
  PASSED = 'PASSED',
  WAITING = 'WAITING',
  REJECTED = 'REJECTED',
  FINAL_SUBMISSION = 'FINAL_SUBMISSION',
}

@Entity({ name: 'student' })
export class StudentEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '학번', example: '10101' })
  @PrimaryColumn()
  id: number

  @ApiProperty({ type: String, description: '이름', example: '홍길동' })
  @Column({ type: 'text' })
  name: string

  @ApiProperty({
    type: String,
    description: '전화번호',
    example: '01012345678',
  })
  @Column({ type: 'text' })
  phone: string

  @ApiProperty({ type: String, required: false })
  @Column({ type: 'text', nullable: true })
  ci?: string

  @ApiProperty({ type: String, required: false })
  @Column({ type: 'text', nullable: true })
  di?: string
}

@Entity({ name: 'parent' })
export class ParentEntity extends BaseEntity {
  @ApiProperty({ type: String, description: '이름' })
  @Column({ type: 'text' })
  name: string

  @ApiProperty({ type: String, description: '전화번호' })
  @PrimaryColumn()
  phone: string

  @ApiProperty({ type: String, description: '학생 간 관계' })
  @Column({ type: 'text' })
  relationship: string

  @ApiProperty({ type: String, required: false })
  @Column({ type: 'text', nullable: true })
  ci?: string

  @ApiProperty({ type: String, required: false })
  @Column({ type: 'text', nullable: true })
  di?: string
}

@Entity({ name: 'raw_answer' })
export class FormRawAnswerEntity extends BaseEntity {
  @ApiProperty({ type: String, description: '질문 번호' })
  @PrimaryColumn()
  id: string

  @ApiProperty({ type: String, description: '답변' })
  @Column({ type: 'text' })
  answer: string

  @ApiProperty({ type: [String], isArray: true, required: false })
  @Column({ type: 'text', array: true, nullable: true })
  files: string[]
}

@Entity({ name: 'answers' })
export class FormAnswerEntity extends BaseEntity {
  @ApiProperty({ type: String })
  @PrimaryColumn()
  id: string

  @ApiProperty({ type: () => StudentEntity })
  @ManyToOne(() => StudentEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: StudentEntity

  @ApiProperty({ type: () => ClubEntity })
  @ManyToOne(() => ClubEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'club_id', referencedColumnName: 'id' })
  club: ClubEntity

  @ApiProperty({ type: () => [FormRawAnswerEntity], isArray: true })
  @ManyToMany(() => FormRawAnswerEntity, (rawAnswer) => rawAnswer.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'raw_answer_id', referencedColumnName: 'id' })
  answers: FormRawAnswerEntity[]
}

@Entity({ name: 'apply_status' })
export class ApplyStatusEntity extends BaseEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @ApiProperty({ type: () => StudentEntity })
  @ManyToOne(() => StudentEntity, (student) => student.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: StudentEntity

  @ApiProperty({ type: () => ClubEntity })
  @ManyToOne(() => ClubEntity, (club) => club.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'club_id', referencedColumnName: 'id' })
  club: ClubEntity

  @ApiProperty({ type: String, enum: Object.values(CurrentStatus) })
  @Column({ type: 'enum', enum: Object.values(CurrentStatus) })
  status: CurrentStatus
}

@Entity({ name: 'apply' })
export class ApplyEntity extends BaseEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @ApiProperty({ type: () => StudentEntity })
  @ManyToOne(() => StudentEntity, (student) => student.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: StudentEntity

  @ApiProperty({ type: () => ParentEntity })
  @ManyToOne(() => ParentEntity, (parent) => parent.phone, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_phone', referencedColumnName: 'phone' })
  parent: ParentEntity

  @ApiProperty({ type: () => [FormAnswerEntity], isArray: true })
  @ManyToMany(() => FormAnswerEntity, (answer) => answer.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'answer_id', referencedColumnName: 'id' })
  answers: FormAnswerEntity[]
}
