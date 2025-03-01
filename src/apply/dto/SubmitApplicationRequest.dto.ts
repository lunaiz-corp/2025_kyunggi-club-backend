import { ApiProperty } from '@nestjs/swagger'

export class SubmitApplicationRequestDto {
  @ApiProperty({
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '학번',
        example: '10101',
      },
      name: {
        type: 'string',
        description: '이름',
        example: '홍길동',
      },
      phone: {
        type: 'string',
        description: '전화번호',
        example: '01012345678',
      },
      verifiedRefId: {
        type: 'string',
        description: '전화번호, CI 등을 서버에서 참조할 수 있는 refId',
        required: false,
      },
    },
  })
  userInfo: {
    /**
     * 학번
     * @example 10101
     */
    id: number

    /**
     * 이름
     * @example 홍길동
     */
    name: string

    /**
     * 전화번호
     * @example 01012345678
     */
    phone: string

    /**
     * 전화번호, CI 등을 서버에서 참조할 수 있는 refId
     */
    verifiedRefId?: string
  }

  @ApiProperty({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '이름',
        example: '홍길동',
      },
      phone: {
        type: 'string',
        description: '전화번호',
        example: '01012345678',
      },
      relationship: {
        type: 'string',
        description: '학생 간 관계',
      },
      verifiedRefId: {
        type: 'string',
        description: '전화번호, CI 등을 서버에서 참조할 수 있는 refId',
        required: false,
      },
    },
  })
  parentInfo: {
    /**
     * 이름
     * @example 홍길동
     */
    name: string

    /**
     * 전화번호
     * @example 01012345678
     */
    phone: string

    /**
     * 학생 간 관계
     */
    relationship: string

    /**
     * 전화번호, CI 등을 서버에서 참조할 수 있는 refId
     */
    verifiedRefId?: string
  }

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        club: {
          type: 'string',
          description: '학생 지망 동아리',
          example: 'list',
        },
        answers: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '질문 번호',
            },
            answer: {
              type: 'string',
              description: '답변',
            },
            files: {
              type: 'array',
              description: '첨부 파일',
              nullable: true,
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  })
  formAnswers: {
    /**
     * 학생 지망 동아리
     * @example list
     */
    club: string

    answers: {
      /**
       * 질문 번호
       */
      id: number
      /**
       * 답변
       */
      answer: string

      /**
       * 첨부 파일
       */
      files: string[]
    }[]
  }[]
}

export default SubmitApplicationRequestDto
