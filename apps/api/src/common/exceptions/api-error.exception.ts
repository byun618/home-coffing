import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
}

/**
 * 통일된 도메인 에러 응답 형식.
 * Controller에서 throw new ApiError(...) 형태로 사용.
 */
export class ApiError extends HttpException {
  constructor(status: HttpStatus, body: ApiErrorBody) {
    super(body, status);
  }
}

export const Errors = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '인증이 필요해요' },
  EMAIL_TAKEN: {
    code: 'EMAIL_TAKEN',
    message: '이미 가입된 이메일이에요',
    field: 'email',
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: '비밀번호는 최소 8자 이상이어야 해요',
    field: 'password',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: '이메일 또는 비밀번호가 맞지 않아요',
  },
  INVALID_REFRESH: {
    code: 'INVALID_REFRESH',
    message: '세션이 만료됐어요. 다시 로그인해주세요',
  },
  INVITATION_NOT_FOUND: {
    code: 'INVITATION_NOT_FOUND',
    message: '유효하지 않은 코드예요',
  },
  INVITATION_EXPIRED: {
    code: 'INVITATION_EXPIRED',
    message: '이 초대 링크는 만료되었어요. 새 링크를 요청해주세요',
  },
  ALREADY_MEMBER: {
    code: 'ALREADY_MEMBER',
    message: '이미 가입된 홈카페예요',
  },
  LAST_ADMIN: {
    code: 'LAST_ADMIN',
    message: '다른 호스트로 권한을 이전한 후 떠날 수 있어요',
  },
  INSUFFICIENT_BEAN: {
    code: 'INSUFFICIENT_BEAN',
    message: '잔량이 부족해요',
  },
  NOT_FOUND: { code: 'NOT_FOUND', message: '찾을 수 없어요' },
  FORBIDDEN: { code: 'FORBIDDEN', message: '권한이 없어요' },
} as const;
