import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { FastifyReply } from 'fastify'

import SubmitApplicationRequestDto from './dto/request/submit-application.request.dto'
import ApplicationStatusMutateRequestDto from './dto/request/application-status-mutate.request.dto'

import PassHashResponseDto from './dto/response/pass-hash.response.dto'
import PassCallbackRequestDto from './dto/request/pass-callback.request.dto'

import ApplicationStatusRetrieveRequestDto from './dto/request/application-status-retrieve.request.dto'

import RegisterCiDiRequestDto from './dto/request/register-cidi.request.dto'

import {
  SendBulkNotificationRequestDto,
  SendNotificationRequestDto,
} from './dto/request/send-notification.request.dto'

import { ApplyService } from './apply.service'

import { AuthGuard } from 'src/auth/auth.guard'
import { RolesService } from 'src/auth/roles.service'
import APIException from 'src/common/dto/APIException.dto'

@ApiTags('Apply - 지원서 제출, 관리 API')
@Controller('apply')
export class ApplyController {
  private readonly logger = new Logger(ApplyController.name)

  constructor(
    private readonly rolesService: RolesService,
    private readonly applyService: ApplyService,
  ) {}

  @Get('pass/encrypt')
  @ApiOperation({
    summary: 'PASS 본인인증 해시값 생성',
    description: 'PASS 본인인증 요청을 위한 해시값을 생성합니다.',
  })
  @ApiBearerAuth()
  async getPassHashData(
    @Query('orderId') orderId: string,
    @Query('device') device: 'pc' | 'android' | 'ios',
  ): Promise<PassHashResponseDto> {
    return await this.applyService.getPassHashData(orderId, device)
  }

  @Post('pass/callback')
  @ApiOperation({
    summary: 'PASS 본인인증 콜백 처리',
    description: 'PASS 본인인증 콜백을 처리합니다.',
  })
  async passCallback(
    @Res() res: FastifyReply,
    @Body() body: PassCallbackRequestDto,
  ) {
    const host =
      process.env.NODE_ENV === 'development'
        ? 'http://samsung:3000'
        : 'https://kyunggi.club'

    if (body.res_cd !== '0000') {
      const encodedResponse = Buffer.from(
        JSON.stringify({ res_cd: body.res_cd, res_msg: body.res_msg }),
      ).toString('base64')

      return res.redirect(
        `${host}/apply/pass/callback?orderId=${body.ordr_idxx}&data=${encodedResponse}`,
        302,
      )
    }

    const response = await this.applyService.getPassVerifyResult(
      body.ordr_idxx,
      {
        certNo: body.cert_no,
        dnHash: body.dn_hash,
        certData: body.enc_cert_data2,
      },
    )

    const encodedResponse = Buffer.from(JSON.stringify(response)).toString(
      'base64',
    )

    return res.redirect(
      `${host}/apply/pass/callback?orderId=${body.ordr_idxx}&data=${encodedResponse}`,
      302,
    )
  }

  @Get('select-chance')
  @ApiOperation({
    summary: '경쟁률 조회',
    description: '경쟁률을 조회합니다.',
  })
  async getSelectChance() {
    return await this.applyService.getSelectChance()
  }

  @Put('new')
  @ApiOperation({
    summary: '지원서 제출',
    description: '실제 입력된 지원서를 업로드합니다.',
  })
  async createApplication(@Body() body: SubmitApplicationRequestDto) {
    await this.applyService.createApplication(body)

    // throw new APIException(
    //   HttpStatus.SERVICE_UNAVAILABLE,
    //   '지원 기간이 종료되었습니다.',
    // )
  }

  @Post('student/:id')
  @ApiOperation({
    summary: '지원서 조회 (학생용)',
    description: '지원서를 조회합니다.',
  })
  async retrieveApplicationForStudent(
    @Param('id') id: number,
    @Body() body: ApplicationStatusRetrieveRequestDto,
  ): Promise<{
    userInfo: {
      id: number
      name: string
      phone: string
    }

    applingClubs: string[]

    currentStatus: {
      club: string
      status: string
    }[]

    formAnswers: {
      club: string
      answers: {
        id: number
        answer: string
        files: string[]
      }[]
    }[]
  }> {
    return await this.applyService.retrieveApplicationForStudent(id, body)
  }

  @Patch('student/:id/cidi')
  @ApiOperation({
    summary: '실명인증 미완료 학생 실명등록',
    description: '실명 인증을 완료하지 않은 학생을 실명 등록합니다.',
  })
  async registerCiDi(
    @Param('id') id: number,
    @Body() body: RegisterCiDiRequestDto,
  ) {
    await this.applyService.registerCiDi(id, body)
  }

  @Get(':club')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 목록 조회',
    description: '지원서 목록을 조회합니다.',
  })
  @ApiBearerAuth()
  async retrieveApplicationsList(@Param('club') club: string) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return await this.applyService.retrieveApplicationsList(club)
  }

  @Post(':club/notification')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 일괄 알림톡 발송',
    description: '지원서에 대한 일괄 알림톡을 전송합니다.',
  })
  @ApiBearerAuth()
  async sendBulkNotification(
    @Param('club') club: string,
    @Body() body: SendBulkNotificationRequestDto,
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return await this.applyService.sendBulkNotification(
      body.ids,
      club,
      'MANUAL',
      body.content,
    )
  }

  @Get(':club/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 조회',
    description: '지원서를 조회합니다.',
  })
  @ApiBearerAuth()
  async retrieveApplication(
    @Param('club') club: string,
    @Param('id') id: number,
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return await this.applyService.retrieveApplication(id, club)
  }

  @Patch(':club/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 상태 수정',
    description: '지원서를 상태를 수정합니다. (합격, 불합격...)',
  })
  @ApiBearerAuth()
  async updateApplicationStatus(
    @Param('club') club: string,
    @Param('id') id: number,
    @Body() body: ApplicationStatusMutateRequestDto,
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.applyService.updateApplicationStatus(club, id, body)
  }

  @Post(':club/:id/notification')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 개별 알림톡 발송',
    description: '지원서에 대한 개별 알림톡을 전송합니다.',
  })
  @ApiBearerAuth()
  async sendNotification(
    @Param('club') club: string,
    @Param('id') id: number,
    @Body() body: SendNotificationRequestDto,
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return await this.applyService.sendNotification(
      id,
      club,
      'MANUAL',
      body.content,
    )
  }

  @Put(':club/:id/final-submit')
  @ApiOperation({
    summary: '최종 지원',
    description: '최종 선발 기간에서 최종 지원합니다.',
  })
  async finalSubmit(@Param('club') club: string, @Param('id') id: number) {
    await this.applyService.finalSubmit(club, id)
  }
}
