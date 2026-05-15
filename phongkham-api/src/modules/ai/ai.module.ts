import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiScheduler } from './ai.scheduler';

@Module({
  controllers: [AiController],
  providers:   [AiService, AiScheduler],
  exports:     [AiService],
})
export class AiModule {}
