import { ApiProperty } from '@nestjs/swagger'

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export enum CurrentStatus {
  WAITING = 'WAITING',

  DOCUMENT_PASSED = 'DOCUMENT_PASSED',
  EXAM_PASSED = 'EXAM_PASSED',
  INTERVIEW_PASSED = 'INTERVIEW_PASSED',

  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  EXAM_REJECTED = 'EXAM_REJECTED',
  INTERVIEW_REJECTED = 'INTERVIEW_REJECTED',

  FINAL_PASSED = 'PASSED',
  FINAL_REJECTED = 'REJECTED',
  FINAL_SUBMISSION = 'FINAL_SUBMISSION',
}

export class Student {
  @ApiProperty({ type: Number, description: '학번', example: '10101' })
  id: number

  @ApiProperty({ type: String, description: '이름', example: '홍길동' })
  name: string

  @ApiProperty({
    type: String,
    description: '전화번호',
    example: '01012345678',
  })
  phone: string

  @ApiProperty({ type: String, required: false })
  ci?: string

  @ApiProperty({ type: String, required: false })
  di?: string
}

export class Parent {
  @ApiProperty({ type: String, description: '이름' })
  name: string

  @ApiProperty({ type: String, description: '전화번호' })
  phone: string

  @ApiProperty({ type: String, description: '학생 간 관계' })
  relationship: string

  @ApiProperty({ type: String, required: false })
  ci?: string

  @ApiProperty({ type: String, required: false })
  di?: string
}

export class FormAnswer {
  @ApiProperty({ type: String, description: '질문 번호' })
  id: string

  @ApiProperty({ type: String, description: '답변' })
  answer: string

  @ApiProperty({ type: [String], isArray: true, required: false })
  files: string[]
}

@Schema()
export class Apply {
  @ApiProperty({ type: String })
  @Prop({ required: true, unique: true, type: String })
  password: string

  @ApiProperty({ type: () => Student })
  @Prop({ required: true, type: Student })
  student: Student

  @ApiProperty({ type: () => Parent })
  @Prop({ required: true, type: Parent })
  parent: Parent

  @ApiProperty({
    type: () => ({
      club: String,
      status: Object.values(CurrentStatus),
      answers: [FormAnswer],
    }),
  })
  @Prop(
    raw([
      {
        club: String,
        status: {
          type: String,
          enum: Object.values(CurrentStatus),
          default: CurrentStatus.WAITING,
        },
        answers: [
          {
            id: String,
            answer: String,
            files: [String],
          },
        ],
      },
    ]),
  )
  answers: { club: string; status: CurrentStatus; answers: FormAnswer[] }[]
}

export type ApplyDocument = HydratedDocument<Apply>
export const ApplySchema = SchemaFactory.createForClass(Apply)
