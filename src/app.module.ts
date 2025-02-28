import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager'

import KeyvRedis from '@keyv/redis'

import { AppController } from './app.controller'
import { ClubModule } from './club/club.module'
import { ApplyModule } from './apply/apply.module'
import { ScheduleModule } from './schedule/schedule.module'
import { CdnModule } from './cdn/cdn.module'
import { NoticeModule } from './notice/notice.module'
import { StatusModule } from './status/status.module'
import { AdvertisementModule } from './advertisement/advertisement.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    process.env.ENABLE_REDIS === '1'
      ? CacheModule.registerAsync({
          useFactory: async (configService: ConfigService) => ({
            stores: [new KeyvRedis(configService.getOrThrow('REDIS_URI'))],
          }),
          inject: [ConfigService],
          isGlobal: true,
        })
      : CacheModule.register({
          isGlobal: true,
        }),
    AppModule,
    ClubModule,
    ApplyModule,
    ScheduleModule,
    CdnModule,
    NoticeModule,
    StatusModule,
    AdvertisementModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
