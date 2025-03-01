import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'
import ClubTemplateMutateRequestDto from './dto/ClubTemplateMutateRequest.dto'
import APIException from 'src/common/dto/APIException.dto'

@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(ClubEntity)
    private readonly clubRepository: Repository<ClubEntity>,

    @InjectRepository(ClubTemplateEntity)
    private readonly clubTemplateRepository: Repository<ClubTemplateEntity>,
  ) {}

  async retrieveClubList() {
    const cachedClubs = await this.cacheManager.get<ClubEntity[]>('club')

    if (cachedClubs) {
      return cachedClubs
    }

    const clubs = await this.clubRepository.find()
    await this.cacheManager.set('club', clubs, 3600 * 1000)

    return clubs
  }

  async retrieveClubInfo(id: string) {
    const cachedClub = await this.cacheManager.get<ClubEntity>(`club:${id}`)

    if (cachedClub) {
      return cachedClub
    }

    const club = await this.clubRepository.findOne({ where: { id } })

    if (!club) {
      throw new APIException(
        HttpStatus.NOT_FOUND,
        `일치하는 동아리 정보를 찾을 수 없습니다.`,
      )
    }

    await this.cacheManager.set(`club:${id}`, club, 3600 * 1000)

    return club
  }

  async retrieveClubApplicationForm(id: string) {
    const cachedForm = await this.cacheManager.get<ClubTemplateEntity[]>(
      `template:${id}`,
    )

    if (cachedForm) {
      return cachedForm
    }

    const form = await this.clubTemplateRepository.find({
      where: { club: { id } },
    })
    await this.cacheManager.set(`template:${id}`, form, 3600 * 1000)

    return form
  }

  async updateClubApplicationForm(
    id: string,
    data: ClubTemplateMutateRequestDto[],
  ) {
    await this.cacheManager.del(`template:${id}`)

    return this.clubTemplateRepository.save(
      data.map((template) => ({
        ...template,
        club: { id },
      })),
    )
  }

  async retrieveClubAdmins(id: string) {
    return
  }

  async addClubAdmin(id: string, data) {
    return
  }

  async deleteClubAdmin(id: string, email: string) {
    return
  }
}
