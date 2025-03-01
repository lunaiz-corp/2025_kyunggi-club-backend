export class PresignedUrlResponseDto {
  /**
   * CDN에 업로드되는 파일명
   * @example 'apply/20210913123456_filename.jpg'
   */
  key: string

  /**
   * 실제 원본 파일명
   * @example 'filename.jpg'
   */
  fileName: string

  /**
   * CDN 업로드 URL
   * @example 'https://....r2.cloudflarestorage.com/apply/20210913123456_filename.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=3600&X-Amz-Signature=...&X-Amz-SignedHeaders=host&x-id=PutObject
   */
  url: string
}

export default PresignedUrlResponseDto
