import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports:     [AiModule],
  controllers: [MedicalRecordsController],
  providers:   [MedicalRecordsService],
  exports:     [MedicalRecordsService],
})
export class MedicalRecordsModule {}
