import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { AuthService } from './auth.service';

@Injectable()
export class AuthScheduler implements OnModuleInit {
  constructor(private readonly authService: AuthService) {}

  onModuleInit() {
    cron.schedule('0 2 * * *', () => this.authService.cleanupExpiredTokens(), {
      timezone: 'Asia/Ho_Chi_Minh',
    });
  }
}
