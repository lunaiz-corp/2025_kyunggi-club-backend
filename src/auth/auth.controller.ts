import {
  Controller,
  Post,
  Logger,
  Body,
  UseGuards,
  Get,
  Req,
  Patch,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { FastifyRequest } from 'fastify'

import { AuthService } from './auth.service'
import { AuthGuard } from './auth.guard'

import SignInRequestDto from './dto/request/sign-in.request.dto'
import ClubAdminSetpasswordRequestDto from './dto/request/club-admin-setpassword.request.dto'
import SignInResponseDto from './dto/response/sign-in.response.dto'

import { Member } from 'src/common/repository/schema/member.schema'

@ApiTags('Auth - 관리자 로그인 API')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @ApiOperation({
    summary: '로그인',
    description: '동아리 관리자에 로그인하고 Access Token을 받습니다.',
  })
  async signIn(@Body() body: SignInRequestDto): Promise<SignInResponseDto> {
    return await this.authService.signIn(body.email, body.password)
  }

  @Patch('set-password')
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 초기 비밀번호 설정',
    description: '동아리 관리자의 초기 비밀번호를 설정합니다.',
  })
  async setAdminPassword(
    @Body() body: ClubAdminSetpasswordRequestDto,
  ): Promise<Partial<Member>> {
    return await this.authService.setAdminPassword(body)
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '현재 계정 조회',
    description: '현재 로그인 된 계정을 조회합니다.',
  })
  @ApiBearerAuth()
  getProfile(
    @Req() req: FastifyRequest & { user: Member & { club: string[] } },
  ): Member & { club: string[] } {
    return req.user
  }
}
