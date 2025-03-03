export class NoticeMutateRequestDto {
  /**
   * 공지사항 제목
   * @example '공지사항 제목'
   */
  title: string

  /**
   * 공지사항 내용
   * @example '공지사항 내용'
   */

  content: string

  /**
   * 공지사항 첨부파일 목록
   * @example ['notice/1/filename.png']
   */
  files: string[]
}

export default NoticeMutateRequestDto
