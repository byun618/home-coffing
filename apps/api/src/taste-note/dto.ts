import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTasteNoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;
}

export class UpdateTasteNoteDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string | null;
}

export interface TasteNoteResponse {
  id: number;
  recordId: number;
  author: { id: number; email: string; displayName: string | null };
  rating: number | null;
  memo: string | null;
  createdAt: Date;
}
