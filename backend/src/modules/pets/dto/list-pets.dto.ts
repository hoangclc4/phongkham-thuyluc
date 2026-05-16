import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { petSpeciesEnum, petStatusEnum } from '../../../database/schema/pets.schema';

export class ListPetsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsEnum(petSpeciesEnum.enumValues)
  @IsOptional()
  species?: string;

  @IsEnum(petStatusEnum.enumValues)
  @IsOptional()
  status?: string;

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
