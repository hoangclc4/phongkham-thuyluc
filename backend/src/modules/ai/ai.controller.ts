import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CustomerGuard } from '../auth/guards/customer.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CustomerJwtPayload } from '../auth/types/jwt-payload.type';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { ChatResponse } from './types/ai-response.type';

@Controller('customer/ai')
@UseGuards(CustomerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@GetUser() user: CustomerJwtPayload, @Body() dto: ChatDto): Promise<ChatResponse> {
    return this.aiService.chat(user.sub, dto);
  }
}
