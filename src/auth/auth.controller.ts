import {
  Controller,
  Post,
  Logger,
  Body,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AuthService } from './auth.service'
import { AuthGuard } from './auth.guard'

import SignInRequestDto from './dto/request/sign-in.request.dto'

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
  async signIn(@Body() body: SignInRequestDto) {
    await this.authService.signIn(body.email, body.password)
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '현재 계정 조회',
    description: '현재 로그인 된 계정을 조회합니다.',
  })
  @ApiBearerAuth()
  getProfile(@Req() req) {
    return req.user
  }
}
