import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sessionId?: string;
}
