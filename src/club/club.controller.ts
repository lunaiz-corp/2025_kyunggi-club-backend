import { Controller, Delete, Get, Patch, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Club - 동아리 정보 API')
@Controller('club')
export class ClubController {
  @Get(':id')
  @ApiOperation({
    summary: '동아리 정보 조회',
    description: '동아리 소개 페이지용 정보를 조회합니다.',
  })
  async retrieveClubInfo() {
    return
  }

  @Get(':id/forms')
  @ApiOperation({
    summary: '동아리 지원서 템플릿 조회',
    description: '동아리 지원서 양식을 조회합니다.',
  })
  async retrieveClubApplicationForm() {
    return
  }

  @Patch(':id/forms')
  @ApiOperation({
    summary: '(ADMIN) 동아리 지원서 템플릿 수정',
    description: '동아리 지원서 양식을 수정합니다.',
  })
  async updateClubApplicationForm() {
    return
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
