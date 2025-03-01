import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import PassHashResponseDto from './dto/PassHashResponse.dto'
import PassCallbackRequestDto from './dto/PassCallbackRequest.dto'

import { ApplyService } from './apply.service'

@ApiTags('Apply - 지원서 제출, 관리 API')
@Controller('apply')
export class ApplyController {
  private readonly logger = new Logger(ApplyController.name)

  constructor(private readonly applyService: ApplyService) {}

  @Put('new')
  @ApiOperation({
    summary: '지원서 제출',
    description: '실제 입력된 지원서를 업로드합니다.',
  })
  async createApplication() {
    return
  }

  @Get('')
  @ApiOperation({
    summary: '(ADMIN) 지원서 목록 조회',
    description: '지원서 목록을 조회합니다.',
  })
  async retrieveApplicationsList() {
    return
  }

  @Post('notification')
  @ApiOperation({
    summary: '(ADMIN) 지원서 일괄 알림톡 발송',
    description: '지원서에 대한 일괄 알림톡을 전송합니다.',
  })
  async sendBulkNotification() {
    return
  }

  @Get(':id')
  @ApiOperation({
    summary: '지원서 조회',
    description: '지원서를 조회합니다.',
  })
  async retrieveApplication() {
    return
  }

  @Patch(':id')
  @ApiOperation({
    summary: '(ADMIN) 지원서 상태 수정',
    description: '지원서를 상태를 수정합니다. (합격, 불합격...)',
  })
  async updateApplicationStatus() {
    return
  }

  @Delete(':id')
  @ApiOperation({
    summary: '(SUPER ADMIN) 지원서 삭제',
    description: '지원서를 삭제합니다.',
  })
  async deleteApplication() {
    return
  }

  @Post(':id/notification')
  @ApiOperation({
    summary: '(ADMIN) 지원서 개별 알림톡 발송',
    description: '지원서에 대한 개별 알림톡을 전송합니다.',
  })
  async sendNotification() {
    return
  }

  @Put(':id/final-submit')
  @ApiOperation({
    summary: '최종 지원',
    description: '최종 선발 기간에서 최종 지원합니다.',
  })
  async finalSubmit() {
    return
  }

  @Get('pass/encrypt')
  @ApiOperation({
    summary: 'PASS 본인인증 해시값 생성',
    description: 'PASS 본인인증 요청을 위한 해시값을 생성합니다.',
  })
  @ApiOkResponse({
    type: PassHashResponseDto,
  })
  async getPassHashData(
    @Query('orderId') orderId: string,
    @Query('device') device: 'pc' | 'android' | 'ios',
  ): Promise<PassHashResponseDto> {
    return this.applyService.getPassHashData(orderId, device)
  }

  @Post('pass/callback')
  @ApiOperation({
    summary: 'PASS 본인인증 콜백 처리',
    description: 'PASS 본인인증 콜백을 처리합니다.',
  })
  async passCallback(@Res() res, @Body() body: PassCallbackRequestDto) {
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
}
