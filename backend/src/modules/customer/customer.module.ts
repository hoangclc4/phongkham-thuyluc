import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [BookingsModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
