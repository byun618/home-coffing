import { Injectable, Logger } from '@nestjs/common';

export interface EventPayload {
  userId: number | null;
  eventName: string;
  properties?: Record<string, unknown>;
}

/**
 * Amplitude wrapper — AMPLITUDE_API_KEY 미세팅 시 NoOp(콘솔 로그).
 * Phase 1 BE는 server-side 이벤트를 거의 발생시키지 않음 (앱이 모바일에서 직접 송신).
 * 필요한 경우(예: 가입 직후 identify) 이 wrapper 통해 호출.
 */
@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private readonly enabled = Boolean(process.env.AMPLITUDE_API_KEY);

  constructor() {
    if (!this.enabled) {
      this.logger.warn(
        'Amplitude disabled — AMPLITUDE_API_KEY not set. Events will be no-op.',
      );
    }
  }

  async track(payload: EventPayload): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(
        `[NoOp Event] ${payload.eventName} ${
          payload.userId ? `(user=${payload.userId})` : ''
        } ${JSON.stringify(payload.properties ?? {})}`,
      );
      return;
    }

    this.logger.warn('Amplitude enabled but adapter not implemented (Phase 2).');
  }
}
