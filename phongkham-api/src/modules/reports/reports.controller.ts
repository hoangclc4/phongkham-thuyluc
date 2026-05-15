import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ReportsService } from './reports.service';
import { DailyReportDto } from './dto/daily-report.dto';
import { WeeklyReportDto } from './dto/weekly-report.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@Controller('admin/reports')
@UseGuards(AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary() {
    return this.reportsService.summary();
  }

  @Get('daily')
  daily(@Query() dto: DailyReportDto) {
    return this.reportsService.daily(dto);
  }

  @Get('weekly')
  weekly(@Query() dto: WeeklyReportDto) {
    return this.reportsService.weekly(dto);
  }

  @Get('monthly')
  monthly(@Query() dto: MonthlyReportDto) {
    return this.reportsService.monthly(dto);
  }
}
