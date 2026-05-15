import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CustomerInviteDto } from './dto/customer-invite.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AdminGuard } from './guards/admin.guard';
import { JwtPayload } from './types/jwt-payload.type';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  JWT_REFRESH_ADMIN_EXPIRY_SECONDS,
  JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from './constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken, admin } = await this.authService.loginAdmin(dto);

    res.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: JWT_REFRESH_ADMIN_EXPIRY_SECONDS,
    });

    return { accessToken, user: admin };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async loginCustomer(
    @Body() dto: CustomerLoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken, customer } = await this.authService.loginCustomer(dto);

    res.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS,
    });

    return { accessToken, user: customer };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetUser() user: JwtPayload,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken, refreshExpiresAtSeconds } =
      await this.authService.refresh(user, user.jti);

    const maxAge =
      user.role === 'admin'
        ? JWT_REFRESH_ADMIN_EXPIRY_SECONDS
        : JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS;

    res.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge,
    });

    return { accessToken, refreshExpiresAtSeconds };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser() user: JwtPayload,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.logout(user.jti, user.exp!);

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/' });

    return { message: 'Đăng xuất thành công' };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'Nếu số điện thoại tồn tại, email hướng dẫn đã được gửi' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Mật khẩu đã được đặt lại thành công' };
  }

  @UseGuards(AdminGuard)
  @Post('customer/invite')
  @HttpCode(HttpStatus.OK)
  async inviteCustomer(@Body() dto: CustomerInviteDto) {
    await this.authService.inviteCustomer(dto);
    return { message: 'Lời mời đã được gửi' };
  }

  @Public()
  @Post('customer/set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken, customer } = await this.authService.setPassword(dto);

    res.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS,
    });

    return { accessToken, user: customer };
  }
}
