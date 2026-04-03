import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean, CafeMember } from '../common/entities';
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
      { populate: ['cafe', 'createdBy'] },
    );

    for (const bean of beans) {
      const stats = await this.beanService.buildBeanWithStats(
        bean,
        bean.createdBy,
      );

      if (stats.status !== 'order') continue;

      const members = await this.em.find(CafeMember, { cafe: bean.cafe });

      const payload = JSON.stringify({
        title: '원두 주문할 때!',
        body: `${bean.name} - 약 ${stats.remainDays}일치 남았어요`,
        url: '/',
      });

      for (const member of members) {
        await this.pushService.sendToUser(member.user.id, payload);
      }
    }

    this.logger.log('주문 타이밍 체크 완료');
  }
}
