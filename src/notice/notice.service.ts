import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository, UpdateResult, DeleteResult, InsertResult } from 'typeorm'

import { NoticeEntity } from 'src/common/repository/entity/notice.entity'

import APIException from 'src/common/dto/APIException.dto'
import NoticeMutateRequestDto from './dto/request/notice-mutate.request.dto'

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
    const cachedNotices = await this.cacheManager.get<NoticeEntity[]>(
      `notice:${board}`,
    )

    if (cachedNotices) {
      return cachedNotices
    }

    const notices = await this.noticeRepository.find({
      where: { category: { id: board } },
      select: { id: true, title: true, created_at: true },
      order: { created_at: 'DESC' },
    })
    await this.cacheManager.set(`notice:${board}`, notices, 1800 * 1000)

    return notices
  }

  async retrieveNotice(board: string, id: number): Promise<NoticeEntity> {
    const cachedNotice = await this.cacheManager.get<NoticeEntity>(
      `notice:${board}:${id}`,
    )

    if (cachedNotice) {
      return cachedNotice
    }

    const notice = await this.noticeRepository.findOne({
      where: { category: { id: board }, id },
    })

    if (!notice) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        '해당 공지사항을 찾을 수 없습니다.',
      )
    }

    await this.cacheManager.set(`notice:${board}:${id}`, notice, 1800 * 1000)
    return notice
  }

  async createNotice(
    board: string,
    data: NoticeMutateRequestDto,
  ): Promise<InsertResult> {
    await this.cacheManager.del(`notice:${board}`)
    return this.noticeRepository.insert({
      category: { id: board },
      title: data.title,
      content: data.content,
    })
  }

  async updateNotice(
    board: string,
    id: number,
    data: NoticeMutateRequestDto,
  ): Promise<UpdateResult> {
    await this.cacheManager.del(`notice:${board}`)
    await this.cacheManager.del(`notice:${board}:${id}`)
    return this.noticeRepository.update(
      { category: { id: board }, id },
      {
        title: data.title,
        content: data.content,
      },
    )
  }

  async deleteNotice(board: string, id: number): Promise<DeleteResult> {
    await this.cacheManager.del(`notice:${board}`)
    await this.cacheManager.del(`notice:${board}:${id}`)
    return this.noticeRepository.delete({ category: { id: board }, id })
  }
}
