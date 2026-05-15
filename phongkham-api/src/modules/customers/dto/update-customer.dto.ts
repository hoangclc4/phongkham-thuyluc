import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @Length(1, 100)
  @IsOptional()
  fullName?: string;

  @IsString()
  @Matches(/^\d[\d\s\-+]{8,14}$/)
  @Length(9, 15)
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
