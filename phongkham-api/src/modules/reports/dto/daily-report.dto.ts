import { IsDateString } from 'class-validator';

export class DailyReportDto {
  @IsDateString()
  date!: string;
}
