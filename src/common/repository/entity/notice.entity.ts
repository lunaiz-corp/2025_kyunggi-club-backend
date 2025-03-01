import { ApiProperty } from '@nestjs/swagger'
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'notice_category' })
export class NoticeCategoryEntity extends BaseEntity {
  @ApiProperty({ type: String })
  @PrimaryColumn({ type: 'text' })
  id: string

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  name: string
}

@Entity({ name: 'notice' })
export class NoticeEntity extends BaseEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @ApiProperty({ type: () => NoticeCategoryEntity })
  @ManyToOne(() => NoticeCategoryEntity, (category) => category.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: NoticeCategoryEntity

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  title: string

  @ApiProperty({ type: String })
  @Column({ type: 'text' })
  content: string

  @ApiProperty({ type: [String], isArray: true, required: false })
  @Column({ type: 'text', array: true, nullable: true })
  files: string[]

  @ApiProperty({ type: Date })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date
}
