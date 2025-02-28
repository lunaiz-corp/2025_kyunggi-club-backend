import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Cdn - CDN 업로드 관리 API')
@Controller('cdn')
export class CdnController {
  @Get(':type/presigned-url')
  @ApiOperation({
    summary: 'CDN 업로드 URL 생성',
    description: 'CDN 업로드 URL을 생성합니다.',
  })
  async createPresignedUrl() {
    return
  }
}
