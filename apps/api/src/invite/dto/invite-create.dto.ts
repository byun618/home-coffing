import { IsNumber, IsOptional, Min } from 'class-validator';

export class InviteCreateDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  expiresInHours?: number;
}
