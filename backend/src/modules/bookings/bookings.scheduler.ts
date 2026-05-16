import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingsScheduler implements OnModuleInit {
  constructor(private readonly bookingsService: BookingsService) {}

  onModuleInit() {
    cron.schedule(
      '0 18 * * *',
      () => this.bookingsService.sendReminderEmails(),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );
  }
}
