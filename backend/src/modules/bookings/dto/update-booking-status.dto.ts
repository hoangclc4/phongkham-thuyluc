import { IsEnum, IsOptional, IsString } from 'class-validator';
import { bookingStatusEnum } from '../../../database/schema/bookings.schema';

export class UpdateBookingStatusDto {
  @IsEnum(bookingStatusEnum.enumValues)
  declare status: string;

  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
