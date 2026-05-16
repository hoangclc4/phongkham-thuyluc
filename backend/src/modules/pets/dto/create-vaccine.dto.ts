import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateVaccineDto {
  @IsString()
  @Length(1, 100)
  declare vaccineName: string;

  @IsDateString()
  declare administeredAt: string;

  @IsDateString()
  @IsOptional()
  nextDueAt?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
