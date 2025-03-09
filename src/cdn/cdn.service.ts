import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

import { Cache } from 'cache-manager'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import APIException from 'src/common/dto/APIException.dto'
import PresignedUrlResponseDto from './dto/response/presigned-url.response.dto'

@Injectable()
export class CdnService {
  private readonly logger = new Logger(CdnService.name)
  private readonly s3: S3Client

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.s3 = new S3Client({
      region: 'apac',
      endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  }

  async createPresignedUrl(
    type: 'apply' | 'notice',
    filename: string,
    keyPrefix?: string,
  ): Promise<PresignedUrlResponseDto> {
    if (!type || !['apply', 'notice'].includes(type)) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        "올바르지 않은 'type' 형식입니다.",
      )
    }

    if (!filename || !/^(?!\.)[^/:*?"<>|]+?\.[^/:*?"<>|]+$/.test(filename)) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        "올바르지 않은 'filename' 형식입니다.",
      )
    }

    const cachedPresignedUrl =
      await this.cacheManager.get<PresignedUrlResponseDto>(
        `presigned-url:${type}:${filename}:${keyPrefix}`,
      )

    if (cachedPresignedUrl) {
      return cachedPresignedUrl
    }

    const key = `${type}/${keyPrefix ? keyPrefix + '/' : ''}${crypto.randomUUID()}_${filename}`
    const result: PresignedUrlResponseDto = {
      key: key,
      fileName: filename,

      url: await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }),
        { expiresIn: 3600 },
      ),
    }

    await this.cacheManager.set(
      `presigned-url:${type}:${filename}:${keyPrefix}`,
      result,
      3600 * 1000,
    )

    return result
  }
}
