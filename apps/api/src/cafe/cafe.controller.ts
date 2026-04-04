import { Controller, Get } from '@nestjs/common';
import { CafeService } from './cafe.service';

@Controller('cafe')
export class CafeController {
  constructor(private readonly cafeService: CafeService) {}

  @Get()
  getInfo() {
    return this.cafeService.getInfo();
  }
}
