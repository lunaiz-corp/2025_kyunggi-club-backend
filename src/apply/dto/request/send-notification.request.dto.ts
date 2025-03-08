export class SendNotificationRequestDto {
  /**
   * 알림 내용
   */
  content: string
}

export class SendBulkNotificationRequestDto {
  /**
   * 학생 학번 목록
   */
  ids: number[]

  /**
   * 알림 내용
   */
  content: string
}

export default SendNotificationRequestDto
