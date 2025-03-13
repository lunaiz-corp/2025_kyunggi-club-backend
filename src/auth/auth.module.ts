import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { MongooseModule } from '@nestjs/mongoose'

import {
  Member,
  MemberSchema,
} from 'src/common/repository/schema/member.schema'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Member.name, schema: MemberSchema }]),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
