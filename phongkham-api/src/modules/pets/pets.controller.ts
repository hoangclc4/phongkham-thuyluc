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
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AdminJwtPayload } from '../auth/types/jwt-payload.type';
import { StorageService } from '../../common/services/storage.service';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsDto } from './dto/list-pets.dto';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AllowedAvatarMimeType,
  AVATAR_MAX_SIZE_BYTES,
} from './constants/pet.constants';

@Controller('admin/pets')
@UseGuards(AdminGuard)
export class PetsController {
  constructor(
    private readonly petsService: PetsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  list(@Query() dto: ListPetsDto) {
    return this.petsService.list(dto);
  }

  @Post()
  create(@Body() dto: CreatePetDto) {
    return this.petsService.create(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.petsService.getOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.petsService.softDelete(id);
  }

  @Get(':id/medical-records')
  getMedicalRecords(@Param('id') id: string) {
    return this.petsService.getMedicalRecords(id);
  }

  @Get(':id/vaccines')
  getVaccines(@Param('id') id: string) {
    return this.petsService.getVaccines(id);
  }

  @Post(':id/vaccines')
  @HttpCode(HttpStatus.CREATED)
  addVaccine(
    @Param('id') id: string,
    @Body() dto: CreateVaccineDto,
    @GetUser() user: AdminJwtPayload,
  ) {
    return this.petsService.addVaccine(id, dto, user.sub);
  }

  @Put(':id/avatar')
  async uploadAvatar(
    @Param('id') id: string,
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
    const avatarUrl = await this.storageService.uploadFile('pets', id, buffer, data.mimetype, ext);

    return this.petsService.updateAvatar(id, avatarUrl);
  }
}
