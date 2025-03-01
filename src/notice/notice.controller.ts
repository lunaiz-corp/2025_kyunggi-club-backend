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

import { NoticeEntity } from 'src/common/repository/entity/notice.entity'

import { NoticeService } from './notice.service'
import NoticeMutateRequestDto from './dto/NoticeMutateRequest.dto'

@ApiTags('Notice - 공지사항 관리 API')
@Controller('notice')
export class NoticeController {
  private readonly logger = new Logger(NoticeController.name)

  constructor(private readonly noticeService: NoticeService) {}

  @Get(':board')
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: '공지사항 목록을 조회합니다.',
  })
  async retrieveNoticesList(
    @Param('board') board: string,
  ): Promise<NoticeEntity[]> {
    return this.noticeService.retrieveNoticesList(board)
  }

  @Get(':board/:id')
  @ApiOperation({
    summary: '공지사항 조회',
    description: '공지사항을 조회합니다.',
  })
  async retrieveNotice(
    @Param('board') board: string,
    @Param('id') id: number,
  ): Promise<NoticeEntity> {
    return this.noticeService.retrieveNotice(board, id)
  }

  @Put(':board')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 추가',
    description: '새로운 공지사항을 추가합니다.',
  })
  async createNotice(
    @Param('board') board: string,
    @Body() data: NoticeMutateRequestDto,
  ): Promise<void> {
    await this.noticeService.createNotice(board, data)
  }

  @Patch(':board/:id')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 수정',
    description: '공지사항을 수정합니다.',
  })
  async updateNotice(
    @Param('board') board: string,
    @Param('id') id: number,
    @Body() data: NoticeMutateRequestDto,
  ): Promise<void> {
    await this.noticeService.updateNotice(board, id, data)
  }

  @Delete(':board/:id')
  @ApiOperation({
    summary: '(ADMIN) 공지사항 삭제',
    description: '공지사항을 삭제합니다.',
  })
  async deleteNotice(
    @Param('board') board: string,
    @Param('id') id: number,
  ): Promise<void> {
    await this.noticeService.deleteNotice(board, id)
  }
}
