import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 100)
  declare fullName: string;

  @IsString()
  @Matches(/^\d[\d\s\-+]{8,14}$/)
  @Length(9, 15)
  declare phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}
