import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { DevicePlatform } from '../common/entities';

export class RegisterDeviceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}

export interface DeviceResponse {
  id: number;
  token: string;
  platform: DevicePlatform;
  createdAt: Date;
  updatedAt: Date;
}
