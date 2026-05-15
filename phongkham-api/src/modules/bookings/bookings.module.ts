import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsScheduler } from './bookings.scheduler';
import { AiModule } from '../ai/ai.module';

@Module({
  imports:     [AiModule],
  controllers: [BookingsController],
  providers:   [BookingsService, BookingsScheduler],
  exports:     [BookingsService],
})
export class BookingsModule {}
