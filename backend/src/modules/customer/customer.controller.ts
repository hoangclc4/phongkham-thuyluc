import {
  BadRequestException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CustomerGuard } from '../auth/guards/customer.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CustomerJwtPayload } from '../auth/types/jwt-payload.type';
import { BookingsService } from '../bookings/bookings.service';
import { StorageService } from '../../common/services/storage.service';
import { CustomerService } from './customer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto';
import { CreateCustomerPetDto } from './dto/create-customer-pet.dto';
import { UpdateCustomerPetDto } from './dto/update-customer-pet.dto';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  type AllowedAvatarMimeType,
  AVATAR_MAX_SIZE_BYTES,
} from '../pets/constants/pet.constants';

@Controller('customer')
@UseGuards(CustomerGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly bookingsService: BookingsService,
    private readonly storageService: StorageService,
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

  @Post('pets')
  @HttpCode(HttpStatus.CREATED)
  createPet(@GetUser() user: CustomerJwtPayload, @Body() dto: CreateCustomerPetDto) {
    return this.customerService.createPet(user.sub, dto);
  }

  @Put('pets/:petId')
  updatePet(
    @GetUser() user: CustomerJwtPayload,
    @Param('petId') petId: string,
    @Body() dto: UpdateCustomerPetDto,
  ) {
    return this.customerService.updatePet(user.sub, petId, dto);
  }

  @Delete('pets/:petId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePet(@GetUser() user: CustomerJwtPayload, @Param('petId') petId: string) {
    return this.customerService.deletePet(user.sub, petId);
  }

  @Put('pets/:petId/avatar')
  async uploadPetAvatar(
    @GetUser() user: CustomerJwtPayload,
    @Param('petId') petId: string,
    @Req() req: FastifyRequest,
  ) {
    const data = await req.file();

    if (!data) {
      throw new BadRequestException('Không có file ảnh');
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(data.mimetype as AllowedAvatarMimeType)) {
      throw new BadRequestException('Chỉ chấp nhận file JPEG, PNG hoặc WebP');
    }

    const buffer = await data.toBuffer();

    if (buffer.length > AVATAR_MAX_SIZE_BYTES) {
      throw new BadRequestException('Kích thước file tối đa 10MB');
    }

    const ext = data.mimetype.split('/')[1];
    const avatarUrl = await this.storageService.uploadFile('pets', petId, buffer, data.mimetype, ext);

    return this.customerService.updatePetAvatar(user.sub, petId, avatarUrl);
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
