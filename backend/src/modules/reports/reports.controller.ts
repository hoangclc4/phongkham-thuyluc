import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
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

  @Get('daily/export')
  async exportDaily(
    @Query() dto: DailyReportDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const buffer = await this.reportsService.exportDailyPdf(dto);
    void reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="bao-cao-ngay-${dto.date}.pdf"`)
      .send(buffer);
  }

  @Get('monthly/export')
  async exportMonthly(
    @Query() dto: MonthlyReportDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const buffer = await this.reportsService.exportMonthlyExcel(dto);
    void reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header(
        'Content-Disposition',
        `attachment; filename="bao-cao-thang-${dto.year}-${String(dto.month).padStart(2, '0')}.xlsx"`,
      )
      .send(buffer);
  }
}
