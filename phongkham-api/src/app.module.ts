import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './common/services/storage.service';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PetsModule } from './modules/pets/pets.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    BookingsModule,
    CustomersModule,
    PetsModule,
    MedicalRecordsModule,
    InvoicesModule,
    ReportsModule,
    CustomerModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
