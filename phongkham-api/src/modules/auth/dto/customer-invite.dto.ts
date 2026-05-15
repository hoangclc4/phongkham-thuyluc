import { IsUUID } from 'class-validator';

export class CustomerInviteDto {
  @IsUUID()
  customerId!: string;
}
