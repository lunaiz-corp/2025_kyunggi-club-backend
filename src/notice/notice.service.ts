import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult } from 'typeorm'

import { NoticeEntity } from 'src/common/repository/entity/notice.entity'

import APIException from 'src/common/dto/APIException.dto'
import NoticeMutateRequestDto from './dto/NoticeMutateRequest.dto'

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async retrieveNoticesList(board: string): Promise<NoticeEntity[]> {
    return this.noticeRepository.find({
      where: { category: { id: board } },
      order: { created_at: 'DESC' },
    })
  }

  async retrieveNotice(board: string, id: number): Promise<NoticeEntity> {
    const notice = await this.noticeRepository.findOne({
      where: { category: { id: board }, id },
    })

    if (!notice) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '해당 공지사항을 찾을 수 없습니다.',
      )
    }

    return notice
  }

  async createNotice(
    board: string,
    data: NoticeMutateRequestDto,
  ): Promise<NoticeEntity> {
    return this.noticeRepository.save({
      category: { id: board },
      title: data.title,
      content: data.content,
      files: data.files,
    })
  }

  async updateNotice(
    board: string,
    id: number,
    data: NoticeMutateRequestDto,
  ): Promise<UpdateResult> {
    return this.noticeRepository.update(
      { category: { id: board }, id },
      {
        title: data.title,
        content: data.content,
        files: data.files,
      },
    )
  }

  async deleteNotice(board: string, id: number): Promise<DeleteResult> {
    return this.noticeRepository.delete({ category: { id: board }, id })
  }
}
