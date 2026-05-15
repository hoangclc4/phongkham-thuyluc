import { IsDateString } from 'class-validator';

export class WeeklyReportDto {
  @IsDateString()
  weekStart!: string;
}
