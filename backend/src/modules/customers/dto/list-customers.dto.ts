import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListCustomersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isActive?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
