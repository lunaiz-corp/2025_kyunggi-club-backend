import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Member } from 'src/common/repository/schema/member.schema'

import { hash, compare, genSalt } from 'bcryptjs'

import ClubAdminSetpasswordRequestDto from './dto/request/club-admin-setpassword.request.dto'
import SignInResponseDto from './dto/response/sign-in.response.dto'

import APIException from 'src/common/dto/APIException.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectModel(Member.name)
    private readonly memberModel: Model<Member>,
  ) {}

  private async hashPassword(raw: string) {
    return hash(raw, await genSalt())
  }

  private async validatePassword(raw: string, hashed: string) {
    return compare(raw, hashed)
  }

  async signIn(email: string, password: string): Promise<SignInResponseDto> {
    const user = (
      await this.memberModel
        .findOne({
          email,
        })
        .exec()
    ).toObject()

    if (!user) {
      throw new APIException(
        HttpStatus.UNAUTHORIZED,
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      )
    }

    if (!user.password) {
      throw new APIException(
        HttpStatus.LOCKED,
        '비밀번호가 아직 설정되지 않았습니다. 관리자에게 문의하세요.',
      )
    }

    const isPasswordCorrect = await this.validatePassword(
      password,
      user.password,
    )

    if (!isPasswordCorrect) {
      throw new APIException(
        HttpStatus.UNAUTHORIZED,
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      )
    }

    const { email: _, password: __, club, ...tokenUser } = user

    return {
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.email,
          club: user.club,
          ...tokenUser,
        },
        {
          secret: process.env.JWT_SECRET,
        },
      ),
    }
  }

  async setAdminPassword(
    data: ClubAdminSetpasswordRequestDto,
  ): Promise<Partial<Member>> {
    const savedRequest = await this.cacheManager.get<{
      club: string
      email: string
    }>(`password-request:${data.pincode}`)

    if (!savedRequest) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        `올바르지 않은 pincode 이거나, 만료된 요청입니다.`,
      )
    }

    await this.memberModel.updateOne(
      { email: savedRequest.email },
      { $set: { password: await this.hashPassword(data.password) } },
    )

    await this.cacheManager.del(`password-request:${data.pincode}`)

    return this.memberModel
      .findOne({ email: savedRequest.email })
      .select('-password -club -createdAt')
  }
}
