import { IsBoolean } from 'class-validator';

export class UpdateSharingDto {
  @IsBoolean()
  isSharedWithCustomer!: boolean;
}
