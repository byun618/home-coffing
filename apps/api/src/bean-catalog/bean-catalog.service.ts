import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  Bean,
  CafeBean,
  CafeUser,
  EntitySource,
  RecordBean,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { BeanCatalogResponse } from './dto';

const DEFAULT_CATALOG_LIMIT = 50;
const DEFAULT_RECENT_LIMIT = 10;

interface ListCatalogOptions {
  search?: string;
  activeOnly?: boolean;
  cafeId?: number;
  limit?: number;
  userId: number;
}

interface ListRecentOptions {
  cafeId: number;
  limit?: number;
  userId: number;
}

@Injectable()
export class BeanCatalogService {
  constructor(private readonly em: EntityManager) {}

  async listCatalog(opts: ListCatalogOptions): Promise<BeanCatalogResponse[]> {
    if (opts.activeOnly && !opts.cafeId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, Errors.NOT_FOUND);
    }
    if (opts.cafeId) {
      await this.assertCafeMember(opts.cafeId, opts.userId);
    }

    const limit = opts.limit ?? DEFAULT_CATALOG_LIMIT;

    if (opts.activeOnly && opts.cafeId) {
      // 활성 CafeBean(archivedAt=null, finishedAt=null, cafe=cafeId)에 연결된 Bean catalog만.
      const activeCafeBeans = await this.em.find(
        CafeBean,
        {
          cafe: opts.cafeId,
          archivedAt: null,
          finishedAt: null,
        },
        { populate: ['bean'] },
      );
      const beanIds = new Set<number>();
      for (const cafeBean of activeCafeBeans) {
        beanIds.add(cafeBean.bean.id);
      }
      if (beanIds.size === 0) return [];

      const beans = await this.em.find(
        Bean,
        {
          id: { $in: Array.from(beanIds) },
          source: EntitySource.GLOBAL,
          ...(opts.search ? { name: { $like: `%${opts.search}%` } } : {}),
        },
        {
          orderBy: { name: 'ASC' },
          limit,
        },
      );
      return beans.map((bean) => this.toResponse(bean));
    }

    const beans = await this.em.find(
      Bean,
      {
        source: EntitySource.GLOBAL,
        ...(opts.search ? { name: { $like: `%${opts.search}%` } } : {}),
      },
      {
        orderBy: { name: 'ASC' },
        limit,
      },
    );
    return beans.map((bean) => this.toResponse(bean));
  }

  async listRecent(opts: ListRecentOptions): Promise<BeanCatalogResponse[]> {
    await this.assertCafeMember(opts.cafeId, opts.userId);
    const limit = opts.limit ?? DEFAULT_RECENT_LIMIT;

    // RecordBean → record.brewedAt desc 기준, CafeBean.bean distinct.
    // populate로 끌어와서 메모리에서 dedup. (cafe scope가 좁아 N도 작음.)
    const recordBeans = await this.em.find(
      RecordBean,
      {
        cafeBean: { cafe: opts.cafeId },
      },
      {
        populate: ['cafeBean', 'cafeBean.bean', 'record'],
        orderBy: { record: { brewedAt: 'DESC' } },
        limit: limit * 5,
      },
    );

    const seen = new Set<number>();
    const beans: Bean[] = [];
    for (const recordBean of recordBeans) {
      const bean = recordBean.cafeBean.bean;
      if (seen.has(bean.id)) continue;
      if (bean.source !== EntitySource.GLOBAL) continue;
      seen.add(bean.id);
      beans.push(bean);
      if (beans.length >= limit) break;
    }
    return beans.map((bean) => this.toResponse(bean));
  }

  private async assertCafeMember(
    cafeId: number,
    userId: number,
  ): Promise<void> {
    const membership = await this.em.findOne(CafeUser, {
      cafe: cafeId,
      user: userId,
    });
    if (!membership) {
      throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
    }
  }

  private toResponse(bean: Bean): BeanCatalogResponse {
    return {
      id: bean.id,
      name: bean.name,
      type: bean.type,
      process: bean.process,
      tastingNote: bean.tastingNote,
    };
  }
}
