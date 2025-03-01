import { ApiProperty } from '@nestjs/swagger'

export class PassHashResponseDto {
  /**
   * KCP 결과 Object
   */
  @ApiProperty({
    type: 'object',
    description: 'KCP 결과 Object',
    properties: {
      res_cd: {
        type: 'string',
        description: '결과 코드',
        example: '0000',
      },
      res_msg: {
        type: 'string',
        description: '결과 메시지',
        example: '정상처리',
      },
    },
  })
  data: {
    /**
     * 결과 코드
     * @example "0000"
     */
    res_cd: string

    /**
     * 결과 메시지
     * @example "정상처리"
     */
    res_msg: string
  }

  /**
   * KCP 본인확인 요청 URL
   * @example "https://cert.kcp.co.kr/kcp_cert/cert_view.jsp"
   */
  @ApiProperty({
    description: 'KCP 본인확인 요청 URL',
    example: 'https://cert.kcp.co.kr/kcp_cert/cert_view.jsp',
  })
  url?: string

  /**
   * KCP 본인확인 요청 Form Data
   */
  @ApiProperty({
    type: 'object',
    description: 'KCP 본인확인 요청 Form Data',
    properties: {
      site_cd: {
        type: 'string',
        description: '사이트 코드',
        example: 'AO0QE',
      },
      ordr_idxx: {
        type: 'string',
        description: '요청 번호',
        example: 'KGH20220913123456@abcdefghij',
      },
      req_tx: {
        type: 'string',
        description: '요청 종류 - 고정값 CERT',
        example: 'CERT',
      },
      cert_method: {
        type: 'string',
        description: '요청 구분 - 고정값 01',
        example: '01',
      },
      up_hash: {
        type: 'string',
        description: '요청 hash data',
        example: 'B57CFD6CB4ADAEE...F6002066B1',
      },
      cert_otp_use: {
        type: 'string',
        description: `cert_otp_use 필수 (메뉴얼 참고)
            Y : 실명 확인 + OTP 점유 확인 , N : 실명 확인 only`,
        example: 'Y',
      },
      web_siteid_hashYN: {
        type: 'string',
        description: `web_siteid 검증 을 위한 필드 - web_siteid 사용시 Y로 전달`,
        example: '',
      },
      web_siteid: {
        type: 'string',
        description: `웹사이트 아이디 - web_siteid 사용시 전달`,
        example: '',
      },
      Ret_URL: {
        type: 'string',
        description: 'Ret_URL',
        example: 'https://api.kyunggi.club/apply/pass/decrypt',
      },
      cert_enc_use_ext: {
        type: 'string',
        description: '리턴 암호화 고도화 - 고정값 Y',
        example: 'Y',
      },
      kcp_merchant_time: {
        type: 'string',
        description: `[API 전용 필드] NHN KCP로 넘기는 상점 서버 시간
            up_hash 생성 후 리턴받은 값 그대로 전달`,
        example: '20220913123456',
      },
      kcp_cert_lib_ver: {
        type: 'string',
        description: `KCP 본인확인 라이브러리 버전 정보
            API의 경우: up_hash 생성 후 리턴받은 값 그대로 전달`,
        example: 'KCP_CERT_API_1_0',
      },
      kcp_cert_pass_use: {
        type: 'string',
        description: `[iOS 전용 필드] PASS 앱 스키마 등록 이후 추가 변수
            iOS에서 PASS 앱 호출 방식으로 이용시 "Y" 설정`,
        example: 'Y',
      },
      kcp_cert_intent_use: {
        type: 'string',
        description: `[Android 전용 필드] PASS 앱 intent 처리 이후 추가 변수
            Android에서 PASS 앱 호출 방식으로 이용시 "Y" 설정`,
        example: 'Y',
      },
      kcp_page_submit_yn: {
        type: 'string',
        description: `[2023-11-27 KCP 김민규] 페이지 전환 호출 파라미터 추가
            본인확인창을 페이지 전환 방식으로 호출하고자 할 경우 "Y" 설정하여 호출 바랍니다.`,
        example: 'Y',
      },
    },
  })
  formData?: {
    /**
     * 사이트 코드
     * @example "AO0QE"
     */
    site_cd: string

    /**
     * 요청 번호
     * @example "KGH20220913123456@abcdefghij"
     */
    ordr_idxx: string

    /**
     * 요청 종류 - 고정값 CERT
     * @example "CERT"
     */
    req_tx: string

    /**
     * 요청 구분 - 고정값 01
     * @example "01"
     */
    cert_method: string

    /**
     * 요청 hash data
     * @example "B57CFD6CB4ADAEE...F6002066B1"
     */
    up_hash: string

    /**
     * cert_otp_use 필수 (메뉴얼 참고)
     * Y : 실명 확인 + OTP 점유 확인 , N : 실명 확인 only
     * @example "Y"
     */
    cert_otp_use: string

    /**
     * web_siteid 검증 을 위한 필드 - web_siteid 사용시 Y로 전달
     * @example ""
     */
    web_siteid_hashYN: string

    /**
     * 웹사이트 아이디 - web_siteid 사용시 전달
     * @example ""
     */
    web_siteid: string

    /**
     * Ret_URL
     * @example "https://api.kyunggi.club/apply/pass/decrypt"
     */
    Ret_URL: string

    /**
     * 리턴 암호화 고도화 - 고정값 Y
     * @example "Y"
     */
    cert_enc_use_ext: string

    /**
     * [API 전용 필드] NHN KCP로 넘기는 상점 서버 시간
     * up_hash 생성 후 리턴받은 값 그대로 전달
     * @example "20220913123456"
     */
    kcp_merchant_time: string

    /**
     * KCP 본인확인 라이브러리 버전 정보
     * API의 경우: up_hash 생성 후 리턴받은 값 그대로 전달
     * @example "KCP_CERT_API_1_0"
     */
    kcp_cert_lib_ver: string

    /**
     * [iOS 전용 필드] PASS 앱 스키마 등록 이후 추가 변수
     * iOS에서 PASS 앱 호출 방식으로 이용시 "Y" 설정
     * @example "Y"
     */
    kcp_cert_pass_use?: string

    /**
     * [Android 전용 필드] PASS 앱 intent 처리 이후 추가 변수
     * Android에서 PASS 앱 호출 방식으로 이용시 "Y" 설정
     * @example "Y"
     */
    kcp_cert_intent_use?: string

    /**
     * [2023-11-27 KCP 김민규] 페이지 전환 호출 파라미터 추가
     * 본인확인창을 페이지 전환 방식으로 호출하고자 할 경우 "Y" 설정하여 호출 바랍니다.
     * @example "Y"
     */
    kcp_page_submit_yn: string
  }
}

export default PassHashResponseDto
