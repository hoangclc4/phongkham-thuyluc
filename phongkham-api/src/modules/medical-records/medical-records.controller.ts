import {
  BadRequestException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AdminJwtPayload } from '../auth/types/jwt-payload.type';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { ListMedicalRecordsDto } from './dto/list-medical-records.dto';
import { UpdateSharingDto } from './dto/update-sharing.dto';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_MAX_SIZE_BYTES,
  ATTACHMENT_TYPES,
  AllowedAttachmentMimeType,
  AttachmentTypeValue,
} from './constants/medical-record.constants';

@Controller('admin/medical-records')
@UseGuards(AdminGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get()
  list(@Query() dto: ListMedicalRecordsDto) {
    return this.medicalRecordsService.list(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMedicalRecordDto, @GetUser() user: AdminJwtPayload) {
    return this.medicalRecordsService.create(dto, user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.medicalRecordsService.getOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }

  @Patch(':id/sharing')
  updateSharing(@Param('id') id: string, @Body() dto: UpdateSharingDto) {
    return this.medicalRecordsService.updateSharing(id, dto);
  }

  @Patch(':id')
  updatePartial(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }

  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  async addAttachment(
    @Param('id') id: string,
    @Query('type') typeParam: string | undefined,
    @Req() req: FastifyRequest,
  ) {
    const data = await req.file();

    if (!data) {
      throw new BadRequestException('Không có file đính kèm');
    }

    if (!(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(data.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file JPEG, PNG, WebP hoặc PDF');
    }

    const buffer = await data.toBuffer();

    if (buffer.length > ATTACHMENT_MAX_SIZE_BYTES) {
      throw new BadRequestException('Kích thước file tối đa 10MB');
    }

    const attachmentType: AttachmentTypeValue | undefined =
      typeParam && (ATTACHMENT_TYPES as readonly string[]).includes(typeParam)
        ? (typeParam as AttachmentTypeValue)
        : undefined;

    return this.medicalRecordsService.addAttachment(id, {
      buffer,
      mimeType: data.mimetype as AllowedAttachmentMimeType,
      originalFilename: data.filename,
      attachmentType,
    });
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.OK)
  deleteAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.medicalRecordsService.deleteAttachment(id, attachmentId);
  }
}
