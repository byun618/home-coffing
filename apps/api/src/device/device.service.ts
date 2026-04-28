import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { DeviceToken, User } from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { DeviceResponse, RegisterDeviceDto } from './dto';

@Injectable()
export class DeviceService {
  constructor(private readonly em: EntityManager) {}

  async register(
    userId: number,
    dto: RegisterDeviceDto,
  ): Promise<DeviceResponse> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);

    const existing = await this.em.findOne(DeviceToken, {
      user: userId,
      token: dto.token,
    });
    if (existing) {
      existing.platform = dto.platform;
      existing.updatedAt = new Date();
      await this.em.flush();
      return this.toResponse(existing);
    }

    const device = this.em.create(DeviceToken, {
      user,
      platform: dto.platform,
      token: dto.token,
    });
    this.em.persist(device);
    await this.em.flush();

    return this.toResponse(device);
  }

  async unregister(userId: number, deviceId: number): Promise<void> {
    const device = await this.em.findOne(DeviceToken, {
      id: deviceId,
      user: userId,
    });
    if (!device) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    this.em.remove(device);
    await this.em.flush();
  }

  private toResponse(device: DeviceToken): DeviceResponse {
    return {
      id: device.id,
      token: device.token,
      platform: device.platform,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}
