import {
  Body,
  Controller,
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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';

@Controller('admin/invoices')
@UseGuards(AdminGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(@Query() dto: ListInvoicesDto) {
    return this.invoicesService.list(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInvoiceDto, @GetUser() user: AdminJwtPayload) {
    return this.invoicesService.create(dto, user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.invoicesService.getOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Patch(':id/payment')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.invoicesService.updatePayment(id, dto);
  }
}
