import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { AiService } from './ai.service';

@Injectable()
export class AiScheduler implements OnModuleInit {
  constructor(private readonly aiService: AiService) {}

  onModuleInit() {
    cron.schedule(
      '0 6 * * *',
      () => this.aiService.generateMorningReport().catch(() => {}),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );
  }
}
