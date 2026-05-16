import { Type } from 'class-transformer';
import {
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
  bookingStatusEnum,
} from '../../../database/schema/bookings.schema';

const SORT_BY_VALUES = ['scheduledAt', 'createdAt', 'status'] as const;
const SORT_ORDER_VALUES = ['asc', 'desc'] as const;

export class ListBookingsDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(bookingStatusEnum.enumValues)
  status?: string;

  @IsOptional()
  @IsEnum(bookingServiceEnum.enumValues)
  serviceType?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SORT_BY_VALUES)
  sortBy?: string = 'scheduledAt';

  @IsOptional()
  @IsEnum(SORT_ORDER_VALUES)
  sortOrder?: string = 'asc';
}
