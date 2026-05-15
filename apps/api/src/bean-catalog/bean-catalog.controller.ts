import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BeanCatalogService } from './bean-catalog.service';
import {
  BeanCatalogResponse,
  ListBeanCatalogDto,
  RecentBeanCatalogDto,
} from './dto';

@Controller('beans')
@UseGuards(JwtAuthGuard)
export class BeanCatalogController {
  constructor(private readonly beanCatalogService: BeanCatalogService) {}

  @Get('recent')
  async listRecent(
    @CurrentUser() user: JwtPayload,
    @Query() query: RecentBeanCatalogDto,
  ): Promise<BeanCatalogResponse[]> {
    return this.beanCatalogService.listRecent({
      cafeId: query.cafeId,
      limit: query.limit,
      userId: user.sub,
    });
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBeanCatalogDto,
  ): Promise<BeanCatalogResponse[]> {
    return this.beanCatalogService.listCatalog({
      search: query.search,
      activeOnly: query.activeOnly,
      cafeId: query.cafeId,
      limit: query.limit,
      userId: user.sub,
    });
  }
}
