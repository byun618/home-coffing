import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean } from '../common/entities';
import { BeanService } from '../bean/bean.service';
import { PushService } from '../push/push.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly beanService: BeanService,
    private readonly pushService: PushService,
  ) {}

  @Cron('0 9 * * *')
  async checkOrderTiming(): Promise<void> {
    this.logger.log('주문 타이밍 체크 시작');

    const beans = await this.em.find(
      Bean,
      { remainAmount: { $gt: 0 } },
      { populate: ['cafe'] },
    );

    for (const bean of beans) {
      const stats = await this.beanService.buildBeanWithStats(bean);

      if (stats.status === 'safe' || stats.status === 'degassing' || stats.status === 'empty') continue;

      const label = stats.status === 'order' ? '지금 시켜야 해요' : '곧 시켜야 해요';
      const payload = JSON.stringify({
        title: `${bean.name} - ${label}`,
        body: `${stats.remainAmount}g 남았어요`,
        url: '/',
      });

      await this.pushService.sendToAll(payload);
    }

    this.logger.log('주문 타이밍 체크 완료');
  }
}
