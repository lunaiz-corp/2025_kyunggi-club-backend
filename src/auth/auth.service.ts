import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { MemberEntity } from 'src/common/repository/entity/member.entity'
import { Repository } from 'typeorm'

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

    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  private async hashPassword(raw: string) {
    return hash(raw, await genSalt())
  }

  private async validatePassword(raw: string, hashed: string) {
    return compare(raw, hashed)
  }

  async signIn(email: string, password: string): Promise<SignInResponseDto> {
    const user = await this.memberRepository.findOne({
      where: {
        email,
      },
    })

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

    const { email: _, ...tokenUser } = user

    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.email,
        ...tokenUser,
      }),
    }
  }

  async setAdminPassword(
    data: ClubAdminSetpasswordRequestDto,
  ): Promise<Partial<MemberEntity>> {
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

    await this.memberRepository.update(
      { email: savedRequest.email },
      { password: await this.hashPassword(data.password) },
    )

    await this.cacheManager.del(`password-request:${data.pincode}`)

    return this.memberRepository.findOne({
      where: { email: savedRequest.email },
      select: ['email', 'name', 'phone', 'role', 'permission', 'club'],
    })
  }
}
