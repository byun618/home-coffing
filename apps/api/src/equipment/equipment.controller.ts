import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EquipmentType } from '../common/entities';
import {
  CreateEquipmentDto,
  EquipmentResponse,
} from './dto';
import { EquipmentService } from './equipment.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('equipments')
  async list(@Query('type') typeRaw?: string): Promise<EquipmentResponse[]> {
    const type = parseEquipmentType(typeRaw);
    return this.equipmentService.list(type);
  }

  @Post('equipments')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEquipmentDto,
  ): Promise<EquipmentResponse> {
    return this.equipmentService.create(user.sub, dto);
  }
}

function parseEquipmentType(raw: string | undefined): EquipmentType | undefined {
  if (raw === undefined || raw === '') return undefined;
  const allowed = Object.values(EquipmentType);
  const matched = allowed.find((value) => value === raw);
  if (!matched) {
    throw new BadRequestException(`Invalid equipment type: ${raw}`);
  }
  return matched;
}
