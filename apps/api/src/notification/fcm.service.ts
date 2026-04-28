import { Injectable, Logger } from '@nestjs/common';

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * FCM_SERVICE_ACCOUNT_JSON 미세팅 시 NoOp — 콘솔 로그만.
 * Phase 2에서 실제 firebase-admin 연동 시 send() 메서드 구현 대체.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly enabled = Boolean(process.env.FCM_SERVICE_ACCOUNT_JSON);

  constructor() {
    if (!this.enabled) {
      this.logger.warn(
        'FCM disabled — FCM_SERVICE_ACCOUNT_JSON not set. Push notifications will be no-op.',
      );
    }
  }

  async send(message: FcmMessage): Promise<{ ok: boolean }> {
    if (!this.enabled) {
      this.logger.debug(
        `[NoOp FCM] ${message.title}: ${message.body} → ${message.token.slice(0, 12)}…`,
      );
      return { ok: true };
    }

    this.logger.warn('FCM enabled but adapter not implemented (Phase 2).');
    return { ok: false };
  }
}
