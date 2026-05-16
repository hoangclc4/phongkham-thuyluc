import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  bookingServiceEnum,
  bookingSourceEnum,
} from '../../../database/schema/bookings.schema';

export class CreateBookingDto {
  @IsUUID()
  declare customerId: string;

  @IsUUID()
  declare petId: string;

  @IsEnum(bookingServiceEnum.enumValues)
  declare serviceType: string;

  @IsDateString()
  declare scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsEnum(bookingSourceEnum.enumValues)
  source?: string;

  @IsOptional()
  @IsBoolean()
  overrideSlotFull?: boolean;
}
