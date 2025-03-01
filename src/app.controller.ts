import { Controller, Get } from '@nestjs/common'
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'

class RootAccessDto {
  /**
   * Default return
   * @example hacking
   */
  @ApiProperty({ example: 'hacking' })
  happy: string = 'hacking'
}

@ApiTags('Common - Health Check API')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: '서버 상태를 확인합니다.',
  })
  @ApiOkResponse({
    type: RootAccessDto,
  })
  rootAccess(): RootAccessDto {
    return { happy: 'hacking' }
  }
}
