import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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

import { RolesService } from 'src/auth/roles.service'
import { ClubService } from './club.service'

import ClubTemplateMutateRequestDto from './dto/request/club-template-mutate.request.dto'
import ClubAdminMutateRequestDto from './dto/request/club-admin-mutate.request.dto'

import { MemberEntity } from 'src/common/repository/entity/member.entity'

import APIException from 'src/common/dto/APIException.dto'

@ApiTags('Club - 동아리 정보 API')
@Controller('club')
export class ClubController {
  private readonly logger = new Logger(ClubController.name)

  constructor(
    private readonly rolesService: RolesService,

    private readonly clubService: ClubService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: '동아리 목록 조회',
    description: '동아리 목록을 조회합니다.',
  })
  async retrieveClubList(): Promise<ClubEntity[]> {
    return await this.clubService.retrieveClubList()
  }

  @Get(':club')
  @ApiOperation({
    summary: '동아리 정보 조회',
    description: '동아리 소개 페이지용 정보를 조회합니다.',
  })
  async retrieveClubInfo(@Param('club') club: string): Promise<ClubEntity> {
    return await this.clubService.retrieveClubInfo(club)
  }

  @Get(':club/forms')
  @ApiOperation({
    summary: '동아리 지원서 템플릿 조회',
    description: '동아리 지원서 양식을 조회합니다.',
  })
  async retrieveClubApplicationForm(
    @Param('club') club: string,
  ): Promise<ClubTemplateEntity[]> {
    return await this.clubService.retrieveClubApplicationForm(club)
  }

  @Patch(':club/forms')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 지원서 템플릿 수정',
    description: '동아리 지원서 양식을 수정합니다.',
  })
  @ApiBearerAuth()
  async updateClubApplicationForm(
    @Param('club') club: string,
    @Body() body: ClubTemplateMutateRequestDto[],
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.clubService.updateClubApplicationForm(club, body)
  }

  @Get(':club/members')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 목록 조회',
    description: '동아리 관리자 목록을 조회합니다.',
  })
  @ApiBearerAuth()
  async retrieveClubAdmins(
    @Param('club') club: string,
  ): Promise<(MemberEntity & { club: string[] })[]> {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    return await this.clubService.retrieveClubAdmins(club)
  }

  @Put(':club/members')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '(ADMIN) 동아리 관리자 추가',
    description: '동아리 관리자를 추가합니다.',
  })
  @ApiBearerAuth()
  async addClubAdmin(
    @Param('club') club: string,
    @Body() body: ClubAdminMutateRequestDto,
  ) {
    if (club === 'global') {
      if (!this.rolesService.canRootActivate()) {
        throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
      }
    } else if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.clubService.addClubAdmin(club, body)
  }

  @Delete(':club/members')
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
    @Param('club') club: string,
    @Body() body: { email: string },
  ) {
    if (!this.rolesService.canActivate([club])) {
      throw new APIException(HttpStatus.FORBIDDEN, '권한이 없습니다.')
    }

    await this.clubService.deleteClubAdmin(club, body.email)
  }
}
