import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListInvoicesDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'partially_paid', 'waived', 'refunded'])
  paymentStatus?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
