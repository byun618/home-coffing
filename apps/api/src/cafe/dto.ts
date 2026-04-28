import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCafeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;
}

export interface CafeResponse {
  id: number;
  name: string;
  createdAt: Date;
  members: Array<{
    userId: number;
    email: string;
    displayName: string | null;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
}

export interface InvitationResponse {
  id: number;
  code: string;
  expiresAt: Date;
  invitedBy: number;
}
