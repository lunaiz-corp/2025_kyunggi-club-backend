import { Controller, Delete, Get, Patch, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Notice - 공지사항 관리 API')
@Controller('notice')
export class NoticeController {
  @Get(':board')
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: '공지사항 목록을 조회합니다.',
  })
  async retrieveNoticesList() {
    return
  }

  @Get(':board/:id')
  @ApiOperation({
    summary: '공지사항 조회',
    description: '공지사항을 조회합니다.',
  })
  async retrieveNotice() {
    return
  }

  @Put(':board')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 추가',
    description: '새로운 공지사항을 추가합니다.',
  })
  async createNotice() {
    return
  }

  @Patch(':board/:id')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 수정',
    description: '공지사항을 수정합니다.',
  })
  async updateNotice() {
    return
  }

  @Delete(':board/:id')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 삭제',
    description: '공지사항을 삭제합니다.',
  })
  async deleteNotice() {
    return
  }
}
