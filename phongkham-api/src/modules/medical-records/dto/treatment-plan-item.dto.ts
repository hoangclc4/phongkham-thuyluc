import { IsOptional, IsString, Length } from 'class-validator';

export class TreatmentPlanItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @Length(1, 100)
  drug!: string;

  @IsString()
  @Length(1, 100)
  dosage!: string;

  @IsString()
  @Length(1, 100)
  frequency!: string;

  @IsString()
  @Length(1, 50)
  duration!: string;

  @IsString()
  @Length(1, 50)
  route!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
