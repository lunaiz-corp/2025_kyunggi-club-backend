import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'pass-decrypted' })
export class PassEntity extends BaseEntity {
  @PrimaryColumn()
  refId: string

  @Column({ type: 'text' })
  data: string
}
