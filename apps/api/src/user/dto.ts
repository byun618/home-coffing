import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsInt()
  defaultCafeId?: number;
}

export interface MeResponse {
  id: number;
  email: string;
  displayName: string | null;
  defaultCafeId: number | null;
  memberships: Array<{
    cafeId: number;
    cafeName: string;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
}
