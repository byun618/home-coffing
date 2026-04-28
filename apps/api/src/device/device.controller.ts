import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DeviceService } from './device.service';
import { DeviceResponse, RegisterDeviceDto } from './dto';

@Controller('me/devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  async register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceDto,
  ): Promise<DeviceResponse> {
    return this.deviceService.register(user.sub, dto);
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(
    @CurrentUser() user: JwtPayload,
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<void> {
    await this.deviceService.unregister(user.sub, deviceId);
  }
}
