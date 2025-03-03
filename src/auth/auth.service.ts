import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'

import { MemberEntity } from 'src/common/repository/entity/member.entity'
import { Repository } from 'typeorm'

import { hash, compare, genSalt } from 'bcryptjs'
import APIException from 'src/common/dto/APIException.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  private async hashPassword(raw: string) {
    return hash(raw, await genSalt())
  }

  private async validatePassword(raw: string, hashed: string) {
    return compare(raw, hashed)
  }

  async signIn(email: string, password: string): Promise<any> {
    const user = await this.memberRepository.findOne({
      where: {
        email,
      },
    })

    if (!user) {
      throw new APIException(401, '아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    const isPasswordCorrect = await this.validatePassword(
      password,
      user.password,
    )

    if (!isPasswordCorrect) {
      throw new APIException(401, '아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    return {
      access_token: await this.jwtService.signAsync({
        sub: user.email,
        name: user.name,
      }),
    }
  }
}
