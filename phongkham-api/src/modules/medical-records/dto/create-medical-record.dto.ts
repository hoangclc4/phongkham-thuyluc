import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentPlanItemDto } from './treatment-plan-item.dto';

export class CreateMedicalRecordDto {
  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsDateString()
  visitDate!: string;

  @IsOptional()
  @IsString()
  weightAtVisit?: string;

  @IsOptional()
  @IsString()
  temperatureCelsius?: string;

  @IsString()
  @Length(1, 2000)
  chiefComplaint!: string;

  @IsOptional()
  @IsString()
  physicalExamination?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  diagnosisNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanItemDto)
  treatmentPlan?: TreatmentPlanItemDto[];

  @IsOptional()
  @IsString()
  doctorNotes?: string;

  @IsOptional()
  @IsDateString()
  followupDate?: string;

  @IsOptional()
  @IsString()
  followupNotes?: string;

  @IsOptional()
  @IsBoolean()
  isSharedWithCustomer?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAttention?: boolean;

  @IsOptional()
  @IsString()
  attentionReason?: string;
}
