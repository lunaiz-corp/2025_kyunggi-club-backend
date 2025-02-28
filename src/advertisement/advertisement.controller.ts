import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Advertisement - 광고 배너 API')
@Controller('advertisement')
export class AdvertisementController {
  @Get(':page')
  @ApiOperation({
    summary: '광고 배너 조회',
    description: '광고 배너를 조회합니다.',
  })
  async retrieveAdvertisement() {
    return
  }
}
