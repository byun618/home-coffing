import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import * as webPush from 'web-push';
import { PushSubscription, User } from '../common/entities';

@Injectable()
export class PushService {
  constructor(private readonly em: EntityManager) {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:dev@home-coffing.local';

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }
  }

  async subscribe(
    user: User,
    params: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void> {
    const existing = await this.em.findOne(PushSubscription, {
      endpoint: params.endpoint,
    });
    if (existing) return;

    const subscription = this.em.create(PushSubscription, {
      user,
      endpoint: params.endpoint,
      p256dh: params.keys.p256dh,
      auth: params.keys.auth,
    });

    await this.em.persistAndFlush(subscription);
  }

  async unsubscribe(user: User): Promise<void> {
    const subscriptions = await this.em.find(PushSubscription, { user });
    await this.em.removeAndFlush(subscriptions);
  }

  async sendToUser(userId: number, payload: string): Promise<void> {
    const subscriptions = await this.em.find(PushSubscription, {
      user: { id: userId },
    });

    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
      } catch (error: unknown) {
        if (
          error instanceof webPush.WebPushError &&
          error.statusCode === 410
        ) {
          await this.em.removeAndFlush(subscription);
        }
      }
    }
  }
}
