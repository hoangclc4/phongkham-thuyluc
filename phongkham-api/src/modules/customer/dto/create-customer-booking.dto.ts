import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const BOOKING_SERVICE_VALUES = [
  'general_checkup',
  'followup',
  'vaccination',
  'surgery',
  'grooming',
  'laboratory',
  'dental',
  'emergency',
  'other',
] as const;

export class CreateCustomerBookingDto {
  @IsUUID()
  petId!: string;

  @IsIn(BOOKING_SERVICE_VALUES)
  serviceType!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
