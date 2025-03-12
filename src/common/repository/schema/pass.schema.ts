import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

@Schema()
export class PassSession {
  @Prop({ required: true, unique: true, type: String })
  refId: string

  @Prop({ required: true, type: String })
  data: string
}

export type PassSessionDocument = HydratedDocument<PassSession>
export const PassSessionSchema = SchemaFactory.createForClass(PassSession)
