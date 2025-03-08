import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestjsRedoxModule } from 'nestjs-redox'

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'
import { version } from '../package.json'

import metadata from './metadata'

import { GlobalExceptionFilter } from './common/filter/global-exception.filter'
import { TransformInterceptor } from './common/interceptor/transform.interceptor'
import { writeFile } from 'node:fs/promises'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  )

  if (process.env.ENABLE_SWAGGER === '1') {
    const config = new DocumentBuilder()
      .setTitle('경기고 이공연 선발 시스템')
      .setDescription(
        '경기고등학교 이공연 선발 시스템을 위한 백엔드 RestAPI 입니다.',
      )
      .setVersion(version)
      .addBearerAuth()
      .build()

    await SwaggerModule.loadPluginMetadata(metadata)
    const document = SwaggerModule.createDocument(app, config)

    SwaggerModule.setup('docs', app, document)
    NestjsRedoxModule.setup('redoc', app, document, {
      standalone: true,
    })
  }

  if (process.env.GLOBAL_CORS === '1') {
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      // credentials: true,
    })
  } else {
    app.enableCors({
      origin: [
        'https://kyunggi.club',
        'https://www.kyunggi.club',
        'https://admin.kyunggi.club',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    })
  }

  if (process.env.KCP_API_CERT) {
    const realCert = Buffer.from(process.env.KCP_API_CERT, 'base64').toString(
      'utf-8',
    )

    await writeFile('credentials/kcp/splCert.pem', realCert)
  }

  if (process.env.KCP_API_PRIKEY) {
    const realPrikey = Buffer.from(
      process.env.KCP_API_PRIKEY,
      'base64',
    ).toString('utf-8')

    await writeFile('credentials/kcp/splPrikeyPKCS8.pem', realPrikey)
  }

  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor())

  await app.listen(4000, '0.0.0.0')
}

bootstrap()
