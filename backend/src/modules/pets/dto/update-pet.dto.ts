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
  petStatusEnum,
} from '../../../database/schema/pets.schema';

export class UpdatePetDto {
  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsEnum(petSpeciesEnum.enumValues)
  @IsOptional()
  species?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(petGenderEnum.enumValues)
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumberString()
  @IsOptional()
  weightKg?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownAllergies?: string[];

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsString()
  @IsOptional()
  microchipId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(petStatusEnum.enumValues)
  @IsOptional()
  status?: string;
}
