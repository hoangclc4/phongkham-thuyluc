import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  petGenderEnum,
  petSpeciesEnum,
} from '../../../database/schema/pets.schema';

export class CreateCustomerPetDto {
  @IsString()
  @Length(1, 50)
  declare name: string;

  @IsEnum(petSpeciesEnum.enumValues)
  declare species: string;

  @IsEnum(petGenderEnum.enumValues)
  declare gender: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumberString()
  @IsOptional()
  weightKg?: string;

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownAllergies?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
