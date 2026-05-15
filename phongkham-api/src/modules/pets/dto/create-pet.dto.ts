import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import {
  petGenderEnum,
  petSpeciesEnum,
} from '../../../database/schema/pets.schema';

export class CreatePetDto {
  @IsUUID()
  declare customerId: string;

  @IsString()
  @Length(1, 50)
  declare name: string;

  @IsEnum(petSpeciesEnum.enumValues)
  declare species: string;

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
}
