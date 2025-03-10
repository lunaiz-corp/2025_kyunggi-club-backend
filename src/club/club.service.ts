import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectRepository } from '@nestjs/typeorm'
import { Not, Repository } from 'typeorm'

import { Resend } from 'resend'

import { customAlphabet } from 'nanoid'
import { render } from 'ejs'

import {
  ClubEntity,
  ClubTemplateEntity,
} from 'src/common/repository/entity/club.entity'
import {
  MemberEntity,
  MemberPermission,
  MemberRole,
} from 'src/common/repository/entity/member.entity'

import ClubTemplateMutateRequestDto from './dto/request/club-template-mutate.request.dto'
import ClubAdminMutateRequestDto from './dto/request/club-admin-mutate.request.dto'

import APIException from 'src/common/dto/APIException.dto'

@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name)

  private readonly nanoid: (size?: number) => string
  private readonly resend: Resend

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(ClubEntity)
    private readonly clubRepository: Repository<ClubEntity>,

    @InjectRepository(ClubTemplateEntity)
    private readonly clubTemplateRepository: Repository<ClubTemplateEntity>,

    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {
    this.nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  private readonly priorityByRole = {
    [MemberRole.CLUB_LEADER]: 0,
    [MemberRole.CLUB_DEPUTY]: 1,
    [MemberRole.CLUB_MEMBER]: 2,
  }

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

  async retrieveClubApplicationForm(
    id: string,
  ): Promise<(ClubTemplateEntity & { id: number })[]> {
    const cachedForm = await this.cacheManager.get<
      (ClubTemplateEntity & { id: number })[]
    >(`template:${id}`)

    if (cachedForm) {
      return cachedForm
    }

    const form = await this.clubTemplateRepository.find({
      where: { club: { id } },
    })

    const formatted = form.map((template) => ({
      ...template,
      id: Number(template.id.replaceAll(`${id}-`, '')),
    })) as (ClubTemplateEntity & { id: number })[]

    await this.cacheManager.set(`template:${id}`, formatted, 3600 * 1000)
    return formatted
  }

  async updateClubApplicationForm(
    id: string,
    data: ClubTemplateMutateRequestDto[],
  ) {
    await this.cacheManager.del(`template:${id}`)

    await this.clubTemplateRepository.delete({ club: { id } })
    return this.clubTemplateRepository.insert(
      data.map((template) => ({
        ...template,
        id: String(template.id).startsWith(`${id}-`)
          ? id
          : `${id}-${template.id}`,
        club: { id },
      })),
    )
  }

  async retrieveClubAdmins(
    id: string,
  ): Promise<(MemberEntity & { club: string[] })[]> {
    const cachedAdmins = await this.cacheManager.get<
      (MemberEntity & { club: string[] })[]
    >(`admin:${id}`)

    if (cachedAdmins) {
      return cachedAdmins
    }

    const admins = await this.memberRepository.find({
      where: { club: { id }, role: Not(MemberRole.OWNER) },
      select: ['email', 'name', 'phone', 'role'],
    })

    // 직급 단위로 sorting
    const sortedAdmins = admins.sort((a, b) => {
      return this.priorityByRole[a.role] - this.priorityByRole[b.role]
    }) as (MemberEntity & {
      club: string[]
    })[]

    await this.cacheManager.set(`admin:${id}`, sortedAdmins, 3600 * 1000)
    return sortedAdmins
  }

  async addClubAdmin(id: string, data: ClubAdminMutateRequestDto) {
    await this.cacheManager.del(`admin:${id}`)

    const randomPincode = this.nanoid(6)

    await this.memberRepository.save({
      ...data,
      permission: MemberPermission.ADMIN,
      club:
        id !== 'global'
          ? [{ id }]
          : [
              'list',
              'kec',
              'kphc',
              'kbrc',
              'kmoc',
              'kac',
              'css',
              'cel',
              'kcc',
            ].map((x) => ({ id: x })),
    })

    await this.cacheManager.set(
      `password-request:${randomPincode}`,
      { club: id, email: data.email },
      24 * 60 * 60 * 1000,
    )

    await this.resend.emails.send({
      from: '경기고등학교 이공계동아리연합 <no-reply@kyunggi.club>',
      to: [data.email],
      subject:
        '[경기고등학교 이공계동아리연합 선발 사이트] 관리자 비밀번호 설정 안내',
      html: render(
        (
          await readFile(join(__dirname, 'template/password-reset.ejs'))
        ).toString(),
        {
          club:
            id !== 'global'
              ? await this.retrieveClubInfo(id)
              : 'GLOBAL_SUPERADMIN',
          pincode: randomPincode,
        },
      ),
    })
  }

  async deleteClubAdmin(id: string, email: string) {
    await this.cacheManager.del(`admin:${id}`)

    return this.memberRepository.delete({ email, club: { id } })
  }
}
