import { Controller, Get, Logger, Param, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'

import { CdnService } from './cdn.service'

import PresignedUrlResponseDto from './dto/presignedUrlResponse.dto'

@ApiTags('Cdn - CDN 업로드 관리 API')
@Controller('cdn')
export class CdnController {
  private readonly logger = new Logger(CdnController.name)

  constructor(private readonly cdnService: CdnService) {}

  @Get(':type/presigned-url')
  @ApiOperation({
    summary: 'CDN 업로드 URL 생성',
    description: 'CDN 업로드 URL을 생성합니다.',
  })
  @ApiQuery({
    name: 'keyPrefix',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    type: PresignedUrlResponseDto,
  })
  async createPresignedUrl(
    @Param('type') type: 'apply' | 'notice',
    @Query('filename') filename: string,
    @Query('keyPrefix') keyPrefix?: string,
  ): Promise<PresignedUrlResponseDto> {
    return this.cdnService.createPresignedUrl(type, filename, keyPrefix)
  }
}
