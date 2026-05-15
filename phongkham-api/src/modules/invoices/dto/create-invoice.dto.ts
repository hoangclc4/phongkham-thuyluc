import { IsUUID, IsArray, ValidateNested, IsInt, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { LineItemDto } from './line-item.dto';

export class CreateInvoiceDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems!: LineItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  discountReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
