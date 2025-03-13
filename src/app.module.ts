import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { MongooseModule } from '@nestjs/mongoose'
import { CacheModule } from '@nestjs/cache-manager'

import KeyvRedis from '@keyv/redis'

import { AppController } from './app.controller'

import { AuthModule } from './auth/auth.module'

import { ClubModule } from './club/club.module'
import { ApplyModule } from './apply/apply.module'
import { ScheduleModule } from './schedule/schedule.module'
import { CdnModule } from './cdn/cdn.module'
import { NoticeModule } from './notice/notice.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getOrThrow('MONGO_URI'),
      }),
      inject: [ConfigService],
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

    AuthModule,

    ClubModule,
    ApplyModule,
    ScheduleModule,
    CdnModule,
    NoticeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
