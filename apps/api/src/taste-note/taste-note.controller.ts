import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateTasteNoteDto,
  TasteNoteResponse,
  UpdateTasteNoteDto,
} from './dto';
import { TasteNoteService } from './taste-note.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasteNoteController {
  constructor(private readonly tasteNoteService: TasteNoteService) {}

  @Post('records/:recordId/taste-notes')
  async create(
    @Param('recordId', ParseIntPipe) recordId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTasteNoteDto,
  ): Promise<TasteNoteResponse> {
    return this.tasteNoteService.create(recordId, user.sub, dto);
  }

  @Patch('taste-notes/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTasteNoteDto,
  ): Promise<TasteNoteResponse> {
    return this.tasteNoteService.update(id, user.sub, dto);
  }

  @Delete('taste-notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.tasteNoteService.delete(id, user.sub);
  }
}
