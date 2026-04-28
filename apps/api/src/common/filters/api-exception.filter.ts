import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiError,
  ApiErrorBody,
} from '../exceptions/api-error.exception';

/**
 * 전역 예외 → { code, message, field?, meta? } 통일.
 * - ApiError: body 그대로 전달
 * - HttpException (ValidationPipe 포함): 400은 VALIDATION_FAILED로 wrap, 그 외는 status별 mapping
 * - 그 외 Error: 500 INTERNAL_ERROR
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ApiError) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = this.mapHttpException(status, raw);
      response.status(status).json(body);
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: '잠시 후 다시 시도해주세요',
    } satisfies ApiErrorBody);
  }

  private mapHttpException(
    status: number,
    raw: string | object,
  ): ApiErrorBody {
    if (status === HttpStatus.BAD_REQUEST) {
      const messages = this.extractValidationMessages(raw);
      return {
        code: 'VALIDATION_FAILED',
        message: messages[0] ?? '입력 값이 올바르지 않아요',
        meta: messages.length > 0 ? { errors: messages } : undefined,
      };
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return { code: 'UNAUTHORIZED', message: '인증이 필요해요' };
    }
    if (status === HttpStatus.FORBIDDEN) {
      return { code: 'FORBIDDEN', message: '권한이 없어요' };
    }
    if (status === HttpStatus.NOT_FOUND) {
      return { code: 'NOT_FOUND', message: '찾을 수 없어요' };
    }

    if (typeof raw === 'string') {
      return { code: 'HTTP_ERROR', message: raw };
    }
    const message =
      typeof (raw as { message?: unknown }).message === 'string'
        ? ((raw as { message: string }).message)
        : '요청을 처리할 수 없어요';
    return { code: 'HTTP_ERROR', message };
  }

  private extractValidationMessages(raw: string | object): string[] {
    if (typeof raw === 'string') return [raw];
    const message = (raw as { message?: unknown }).message;
    if (Array.isArray(message))
      return message.filter((m): m is string => typeof m === 'string');
    if (typeof message === 'string') return [message];
    return [];
  }
}
