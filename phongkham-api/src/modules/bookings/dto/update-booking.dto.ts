import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { bookingServiceEnum } from '../../../database/schema/bookings.schema';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(bookingServiceEnum.enumValues)
  serviceType?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

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
}
