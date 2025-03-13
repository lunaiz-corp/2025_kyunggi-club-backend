import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { Resend } from 'resend'

import { customAlphabet } from 'nanoid'
import { render } from 'ejs'

import {
  Member,
  MemberPermission,
  MemberRole,
} from 'src/common/repository/schema/member.schema'
import { Club, ClubTemplate } from 'src/common/repository/schema/club.schema'

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

    @InjectModel(Club.name)
    private readonly clubModel: Model<Club>,

    @InjectModel(ClubTemplate.name)
    private readonly clubTemplateModel: Model<ClubTemplate>,

    @InjectModel(Member.name)
    private readonly memberModel: Model<Member>,
  ) {
    this.nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  private readonly priorityByRole = {
    [MemberRole.CLUB_LEADER]: 0,
    [MemberRole.CLUB_DEPUTY]: 1,
    [MemberRole.CLUB_MEMBER]: 2,
  }

  async retrieveClubList(): Promise<Club[]> {
    const cachedClubs = await this.cacheManager.get<Club[]>('club')

    if (cachedClubs) {
      return cachedClubs
    }

    const clubs = await this.clubModel.find()
    await this.cacheManager.set('club', clubs, 3600 * 1000)

    return clubs
  }

  async retrieveClubInfo(id: string): Promise<Club> {
    const cachedClub = await this.cacheManager.get<Club>(`club:${id}`)

    if (cachedClub) {
      return cachedClub
    }

    const club = await this.clubModel.findOne({ id })

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
  ): Promise<(ClubTemplate & { id: number })[]> {
    const cachedForm = await this.cacheManager.get<
      (ClubTemplate & { id: number })[]
    >(`template:${id}`)

    if (cachedForm) {
      return cachedForm
    }

    const form = await this.clubTemplateModel
      .find({ club: id })
      .select('-_id -__v')
      .exec()

    const formatted = form.map((template) => ({
      ...(template.toObject() as ClubTemplate),
      id: Number(template.id.replaceAll(`${id}-`, '')),
    })) as (ClubTemplate & { id: number })[]

    await this.cacheManager.set(`template:${id}`, formatted, 3600 * 1000)
    return formatted
  }

  async updateClubApplicationForm(
    id: string,
    data: ClubTemplateMutateRequestDto[],
  ) {
    await this.cacheManager.del(`template:${id}`)

    await this.clubTemplateModel.deleteMany({ club: id })
    return this.clubTemplateModel.insertMany(
      data.map((template) => ({
        ...template,
        id: `${id}-${template.id}`,
        club: id,
      })),
    )
  }

  async retrieveClubAdmins(id: string): Promise<Member[]> {
    const cachedAdmins = await this.cacheManager.get<Member[]>(`admin:${id}`)
    if (cachedAdmins) return cachedAdmins

    const admins = await this.memberModel
      .find({
        club: { $elemMatch: id },
        role: { $ne: MemberRole.OWNER },
      })
      .select('-password -permission -club -createdAt -_id -__v')
      .exec()

    // 직급 단위로 sorting
    const sortedAdmins = admins.sort((a, b) => {
      return (
        this.priorityByRole[a.toObject().role] -
        this.priorityByRole[b.toObject().role]
      )
    })

    await this.cacheManager.set(`admin:${id}`, sortedAdmins, 3600 * 1000)
    return sortedAdmins
  }

  async addClubAdmin(id: string, data: ClubAdminMutateRequestDto) {
    await this.cacheManager.del(`admin:${id}`)

    const randomPincode = this.nanoid(6)

    await this.memberModel.create({
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
    await this.memberModel.deleteOne({ email, club: { id } })
  }
}
