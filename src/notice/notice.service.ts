import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import {
  Notice,
  NoticeCategory,
} from 'src/common/repository/schema/notice.schema'

import APIException from 'src/common/dto/APIException.dto'
import NoticeMutateRequestDto from './dto/request/notice-mutate.request.dto'

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectModel(Notice.name)
    private readonly noticeModel: Model<Notice>,
  ) {}

  async retrieveNoticesList(board: string): Promise<Notice[]> {
    const cachedNotices = await this.cacheManager.get<Notice[]>(
      `notice:${board}`,
    )

    if (cachedNotices) return cachedNotices

    const notices = await this.noticeModel
      .find({
        category:
          NoticeCategory[board.toUpperCase() as keyof typeof NoticeCategory],
      })
      .select('-category -_id -__v')
      .sort('-createdAt')
      .exec()

    await this.cacheManager.set(`notice:${board}`, notices, 1800 * 1000)

    return notices
  }

  async retrieveNotice(board: string, id: number): Promise<Notice> {
    const cachedNotice = await this.cacheManager.get<Notice>(
      `notice:${board}:${id}`,
    )

    if (cachedNotice) return cachedNotice

    const notice = await this.noticeModel.findOne({
      category:
        NoticeCategory[board.toUpperCase() as keyof typeof NoticeCategory],
      id,
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

  async createNotice(board: string, data: NoticeMutateRequestDto) {
    await this.cacheManager.del(`notice:${board}`)

    const count = await this.noticeModel.countDocuments()
    await this.noticeModel.create({
      id: count + 1,
      category:
        NoticeCategory[board.toUpperCase() as keyof typeof NoticeCategory],
      title: data.title,
      content: data.content,
    })
  }

  async updateNotice(board: string, id: number, data: NoticeMutateRequestDto) {
    await this.cacheManager.del(`notice:${board}`)
    await this.cacheManager.del(`notice:${board}:${id}`)

    await this.noticeModel.updateOne(
      {
        category:
          NoticeCategory[board.toUpperCase() as keyof typeof NoticeCategory],
        id,
      },
      {
        title: data.title,
        content: data.content,
      },
    )
  }

  async deleteNotice(board: string, id: number) {
    await this.cacheManager.del(`notice:${board}`)
    await this.cacheManager.del(`notice:${board}:${id}`)

    await this.noticeModel.deleteOne({
      category:
        NoticeCategory[board.toUpperCase() as keyof typeof NoticeCategory],
      id,
    })
  }
}
