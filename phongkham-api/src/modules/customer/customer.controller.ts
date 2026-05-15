import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerGuard } from '../auth/guards/customer.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CustomerJwtPayload } from '../auth/types/jwt-payload.type';
import { BookingsService } from '../bookings/bookings.service';
import { CustomerService } from './customer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto';

@Controller('customer')
@UseGuards(CustomerGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('profile')
  getProfile(@GetUser() user: CustomerJwtPayload) {
    return this.customerService.getProfile(user.sub);
  }

  @Put('profile')
  updateProfile(@GetUser() user: CustomerJwtPayload, @Body() dto: UpdateProfileDto) {
    return this.customerService.updateProfile(user.sub, dto);
  }

  @Put('change-password')
  changePassword(@GetUser() user: CustomerJwtPayload, @Body() dto: ChangePasswordDto) {
    return this.customerService.changePassword(user.sub, dto);
  }

  @Get('pets')
  listPets(@GetUser() user: CustomerJwtPayload) {
    return this.customerService.listPets(user.sub);
  }

  @Get('pets/:petId')
  getPet(@GetUser() user: CustomerJwtPayload, @Param('petId') petId: string) {
    return this.customerService.getPet(user.sub, petId);
  }

  @Get('pets/:petId/medical-records')
  listMedicalRecords(@GetUser() user: CustomerJwtPayload, @Param('petId') petId: string) {
    return this.customerService.listMedicalRecords(user.sub, petId);
  }

  @Get('pets/:petId/medical-records/:recordId')
  getMedicalRecord(
    @GetUser() user: CustomerJwtPayload,
    @Param('petId') petId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.customerService.getMedicalRecord(user.sub, petId, recordId);
  }

  @Get('pets/:petId/vaccines')
  listVaccines(@GetUser() user: CustomerJwtPayload, @Param('petId') petId: string) {
    return this.customerService.listVaccines(user.sub, petId);
  }

  @Get('bookings')
  listBookings(@GetUser() user: CustomerJwtPayload) {
    return this.customerService.listBookings(user.sub);
  }

  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@GetUser() user: CustomerJwtPayload, @Body() dto: CreateCustomerBookingDto) {
    return this.customerService.createBooking(user.sub, dto);
  }

  @Get('bookings/:bookingId')
  getBooking(@GetUser() user: CustomerJwtPayload, @Param('bookingId') bookingId: string) {
    return this.customerService.getBooking(user.sub, bookingId);
  }

  @Delete('bookings/:bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelBooking(@GetUser() user: CustomerJwtPayload, @Param('bookingId') bookingId: string) {
    return this.customerService.cancelBooking(user.sub, bookingId);
  }

  @Get('booking-slots')
  getSlots(@GetUser() user: CustomerJwtPayload, @Query('date') date: string) {
    return this.bookingsService.getSlots(date, user.sub);
  }
}
