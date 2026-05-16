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

export class UpdateCustomerPetDto {
  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsEnum(petSpeciesEnum.enumValues)
  @IsOptional()
  species?: string;

  @IsEnum(petGenderEnum.enumValues)
  @IsOptional()
  gender?: string;

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
