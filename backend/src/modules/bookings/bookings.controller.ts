import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AdminJwtPayload } from '../auth/types/jwt-payload.type';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('admin/bookings')
@UseGuards(AdminGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Specific paths must come before :id to avoid route conflicts
  @Get('slots')
  getSlots(
    @Query('date') date: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.bookingsService.getSlots(date, customerId);
  }

  @Get('today')
  getToday() {
    return this.bookingsService.getToday();
  }

  @Get('upcoming-followups')
  getUpcomingFollowups() {
    return this.bookingsService.getUpcomingFollowups();
  }

  @Get()
  list(@Query() dto: ListBookingsDto) {
    return this.bookingsService.list(dto);
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @GetUser() user: AdminJwtPayload) {
    return this.bookingsService.create(dto, user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.bookingsService.getOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @GetUser() user: AdminJwtPayload,
  ) {
    return this.bookingsService.updateStatus(id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
