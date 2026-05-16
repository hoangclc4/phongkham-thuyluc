import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsIn(['cash', 'bank_transfer', 'momo', 'zalopay', 'other'])
  paymentMethod!: string;

  @IsIn(['pending', 'paid', 'partially_paid', 'waived', 'refunded'])
  paymentStatus!: string;

  @IsInt()
  @Min(0)
  paidAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
