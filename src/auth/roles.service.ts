import { Inject, Injectable, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { Member, MemberRole } from 'src/common/repository/schema/member.schema'

@Injectable({ scope: Scope.REQUEST })
export class RolesService {
  constructor(
    @Inject(REQUEST)
    private readonly request: FastifyRequest & {
      user: Member & { club: string[] }
    },
  ) {}

  canActivate(id: string[]) {
    return id.every((clubId) => this.request.user.club?.includes(clubId))
  }

  canRootActivate() {
    return this.request.user.role === MemberRole.OWNER
  }
}
