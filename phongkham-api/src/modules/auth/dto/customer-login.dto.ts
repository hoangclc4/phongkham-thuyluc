import { IsString, Matches, MinLength } from 'class-validator';

export class CustomerLoginDto {
  @IsString()
  @Matches(/^[0-9+]{9,15}$/)
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
