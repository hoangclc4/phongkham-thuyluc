import { IsInt, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class MonthlyReportDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2020)
  year!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
