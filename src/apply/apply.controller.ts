import {
  Body,
  Controller,
  Get,
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

import { ApplyEntity } from 'src/common/repository/entity/apply.entity'

import { ApplyService } from './apply.service'
import { AuthGuard } from 'src/auth/auth.guard'

@ApiTags('Apply - 지원서 제출, 관리 API')
@Controller('apply')
export class ApplyController {
  private readonly logger = new Logger(ApplyController.name)

  constructor(private readonly applyService: ApplyService) {}

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
        ? 'http://macbook:3000'
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

  @Put('new')
  @ApiOperation({
    summary: '지원서 제출',
    description: '실제 입력된 지원서를 업로드합니다.',
  })
  async createApplication(@Body() body: SubmitApplicationRequestDto) {
    await this.applyService.createApplication(body)
  }

  @Get('status/:id')
  @ApiOperation({
    summary: '지원서 상태 조회',
    description: '지원서를 조회합니다.',
  })
  async retrieveApplicationStatus(
    @Param('id') id: number,
  ): Promise<ApplyEntity[]> {
    return await this.applyService.retrieveApplicationStatus(id)
  }

  @Get(':club')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 목록 조회',
    description: '지원서 목록을 조회합니다.',
  })
  @ApiBearerAuth()
  async retrieveApplicationsList(
    @Param('club') club: string,
  ): Promise<ApplyEntity[]> {
    return await this.applyService.retrieveApplicationsList(club)
  }

  @Post('notification')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 일괄 알림톡 발송',
    description: '지원서에 대한 일괄 알림톡을 전송합니다.',
  })
  @ApiBearerAuth()
  async sendBulkNotification() {
    return await this.applyService.sendBulkNotification()
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
  ): Promise<ApplyEntity> {
    return await this.applyService.retrieveApplication(club, id)
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
    await this.applyService.updateApplicationStatus(club, id, body)
  }

  @Post(':club/:id/notification')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 지원서 개별 알림톡 발송',
    description: '지원서에 대한 개별 알림톡을 전송합니다.',
  })
  @ApiBearerAuth()
  async sendNotification(@Param('club') club: string, @Param('id') id: number) {
    return await this.applyService.sendNotification(club, id)
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
