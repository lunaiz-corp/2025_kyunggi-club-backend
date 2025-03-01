import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Put,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ClubService } from './club.service'
import ClubTemplateMutateRequestDto from './dto/ClubTemplateMutateRequest.dto'
import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'

@ApiTags('Club - 동아리 정보 API')
@Controller('club')
export class ClubController {
  private readonly logger = new Logger(ClubController.name)

  constructor(private readonly clubService: ClubService) {}

  @Get('')
  @ApiOperation({
    summary: '동아리 목록 조회',
    description: '동아리 목록을 조회합니다.',
  })
  async retrieveClubList(): Promise<ClubEntity[]> {
    return this.clubService.retrieveClubList()
  }

  @Get(':id')
  @ApiOperation({
    summary: '동아리 정보 조회',
    description: '동아리 소개 페이지용 정보를 조회합니다.',
  })
  async retrieveClubInfo(@Param('id') id: string): Promise<ClubEntity> {
    return this.clubService.retrieveClubInfo(id)
  }

  @Get(':id/forms')
  @ApiOperation({
    summary: '동아리 지원서 템플릿 조회',
    description: '동아리 지원서 양식을 조회합니다.',
  })
  async retrieveClubApplicationForm(
    @Param('id') id: string,
  ): Promise<ClubTemplateEntity[]> {
    return this.clubService.retrieveClubApplicationForm(id)
  }

  @Patch(':id/forms')
  @ApiOperation({
    summary: '(ADMIN) 동아리 지원서 템플릿 수정',
    description: '동아리 지원서 양식을 수정합니다.',
  })
  async updateClubApplicationForm(
    @Param('id') id: string,
    @Body() body: ClubTemplateMutateRequestDto[],
  ) {
    await this.clubService.updateClubApplicationForm(id, body)
  }

  @Get(':id/members')
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 목록 조회',
    description: '동아리 관리자 목록을 조회합니다.',
  })
  async retrieveClubAdmins() {
    return
  }

  @Put(':id/members')
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 추가',
    description: '동아리 관리자를 추가합니다.',
  })
  async addClubAdmin() {
    return
  }

  @Delete(':id/members')
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 삭제',
    description: '동아리 관리자를 삭제합니다.',
  })
  async deleteClubAdmin() {
    return
  }
}
