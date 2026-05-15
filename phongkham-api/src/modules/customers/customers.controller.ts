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
import { AdminGuard } from '../auth/guards/admin.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';

@Controller('admin/customers')
@UseGuards(AdminGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Query() dto: ListCustomersDto) {
    return this.customersService.list(dto);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.customersService.getOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }

  @Get(':id/pets')
  getCustomerPets(@Param('id') id: string) {
    return this.customersService.getCustomerPets(id);
  }

  @Get(':id/bookings')
  getCustomerBookings(@Param('id') id: string) {
    return this.customersService.getCustomerBookings(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.customersService.getStats(id);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendInvite(@Param('id') id: string) {
    return this.customersService.sendInvite(id);
  }
}
