import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AuthGuard } from 'src/auth/auth.guard'
import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'

import { ClubService } from './club.service'
import ClubTemplateMutateRequestDto from './dto/request/club-template-mutate.request.dto'
import ClubAdminMutateRequestDto from './dto/request/club-admin-mutate.request.dto'
import { MemberEntity } from 'src/common/repository/entity/member.entity'

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
    return await this.clubService.retrieveClubList()
  }

  @Get(':id')
  @ApiOperation({
    summary: '동아리 정보 조회',
    description: '동아리 소개 페이지용 정보를 조회합니다.',
  })
  async retrieveClubInfo(@Param('id') id: string): Promise<ClubEntity> {
    return await this.clubService.retrieveClubInfo(id)
  }

  @Get(':id/forms')
  @ApiOperation({
    summary: '동아리 지원서 템플릿 조회',
    description: '동아리 지원서 양식을 조회합니다.',
  })
  async retrieveClubApplicationForm(
    @Param('id') id: string,
  ): Promise<ClubTemplateEntity[]> {
    return await this.clubService.retrieveClubApplicationForm(id)
  }

  @Patch(':id/forms')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 지원서 템플릿 수정',
    description: '동아리 지원서 양식을 수정합니다.',
  })
  @ApiBearerAuth()
  async updateClubApplicationForm(
    @Param('id') id: string,
    @Body() body: ClubTemplateMutateRequestDto[],
  ) {
    await this.clubService.updateClubApplicationForm(id, body)
  }

  @Get(':id/members')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 목록 조회',
    description: '동아리 관리자 목록을 조회합니다.',
  })
  @ApiBearerAuth()
  async retrieveClubAdmins(@Param('id') id: string): Promise<MemberEntity[]> {
    return await this.clubService.retrieveClubAdmins(id)
  }

  @Put(':id/members')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 추가',
    description: '동아리 관리자를 추가합니다.',
  })
  @ApiBearerAuth()
  async addClubAdmin(
    @Param('id') id: string,
    @Body() body: ClubAdminMutateRequestDto,
  ) {
    await this.clubService.addClubAdmin(id, body)
  }

  @Delete(':id/members')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 삭제',
    description: '동아리 관리자를 삭제합니다.',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: '삭제할 관리자의 이메일',
          example: 'biz.kyunggi@lunaiz.com',
        },
      },
    },
  })
  async deleteClubAdmin(
    @Param('id') id: string,
    @Body() body: { email: string },
  ) {
    await this.clubService.deleteClubAdmin(id, body.email)
  }
}
