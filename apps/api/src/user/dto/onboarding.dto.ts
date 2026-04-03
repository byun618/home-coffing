import { IsNumber, Min } from 'class-validator';

export class OnboardingDto {
  @IsNumber()
  @Min(1)
  defaultCupsPerDay!: number;

  @IsNumber()
  @Min(1)
  defaultGramsPerCup!: number;
}
