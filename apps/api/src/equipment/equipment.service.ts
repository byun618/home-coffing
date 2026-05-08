import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Equipment, EquipmentType, User } from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { CreateEquipmentDto, EquipmentResponse } from './dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly em: EntityManager) {}

  async list(type?: EquipmentType): Promise<EquipmentResponse[]> {
    const where = type ? { type } : {};
    const equipments = await this.em.find(Equipment, where);

    const sorted = equipments
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    return sorted.map((equipment) => toEquipmentResponse(equipment));
  }

  async create(
    userId: number,
    dto: CreateEquipmentDto,
  ): Promise<EquipmentResponse> {
    return this.em.transactional(async (em) => {
      const brand = dto.brand ?? null;
      const model = dto.model ?? null;

      const existing = await em.findOne(Equipment, {
        type: dto.type,
        name: dto.name,
        brand,
        model,
      });
      if (existing) {
        return toEquipmentResponse(existing);
      }

      const user = await em.findOne(User, { id: userId });
      if (!user) throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);

      const equipment = em.create(Equipment, {
        type: dto.type,
        name: dto.name,
        brand,
        model,
        createdBy: user,
      });
      em.persist(equipment);
      await em.flush();
      return toEquipmentResponse(equipment);
    });
  }
}

function toEquipmentResponse(equipment: Equipment): EquipmentResponse {
  return {
    id: equipment.id,
    type: equipment.type,
    name: equipment.name,
    brand: equipment.brand,
    model: equipment.model,
  };
}
