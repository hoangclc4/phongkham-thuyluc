import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { randomBytes, createHash } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { adminUsers } from '../../database/schema/admin-users.schema';
import { customers } from '../../database/schema/customers.schema';
import { tokenBlacklist } from '../../database/schema/token-blacklist.schema';
import {
  AdminJwtPayload,
  CustomerJwtPayload,
  JwtPayload,
} from './types/jwt-payload.type';
import {
  BCRYPT_SALT_ROUNDS,
  INVITE_TOKEN_EXPIRY_HOURS,
  JWT_ACCESS_ADMIN_EXPIRY,
  JWT_ACCESS_CUSTOMER_EXPIRY,
  JWT_REFRESH_ADMIN_EXPIRY,
  JWT_REFRESH_ADMIN_EXPIRY_SECONDS,
  JWT_REFRESH_CUSTOMER_EXPIRY,
  JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS,
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
} from './constants/auth.constants';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CustomerInviteDto } from './dto/customer-invite.dto';
import { SetPasswordDto } from './dto/set-password.dto';

type AdminTokenPayloadInput = Omit<AdminJwtPayload, 'jti' | 'iat' | 'exp'>;
type CustomerTokenPayloadInput = Omit<CustomerJwtPayload, 'jti' | 'iat' | 'exp'>;
type TokenPayloadInput = AdminTokenPayloadInput | CustomerTokenPayloadInput;

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAtSeconds: number;
  jti: string;
}

interface AdminLoginResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAtSeconds: number;
  admin: { id: string; email: string; fullName: string };
}

interface CustomerLoginResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAtSeconds: number;
  customer: { id: string; phone: string; fullName: string };
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAtSeconds: number;
}

@Injectable()
export class AuthService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly jwtService: JwtService,
  ) {}

  private generateTokens(payload: TokenPayloadInput): GeneratedTokens {
    const jti = crypto.randomUUID();
    const isAdmin = payload.role === 'admin';

    const accessExpiry = isAdmin ? JWT_ACCESS_ADMIN_EXPIRY : JWT_ACCESS_CUSTOMER_EXPIRY;
    const refreshExpiry = isAdmin ? JWT_REFRESH_ADMIN_EXPIRY : JWT_REFRESH_CUSTOMER_EXPIRY;
    const refreshExpiresAtSeconds = isAdmin
      ? JWT_REFRESH_ADMIN_EXPIRY_SECONDS
      : JWT_REFRESH_CUSTOMER_EXPIRY_SECONDS;

    const accessToken = this.jwtService.sign(
      { ...payload, jti },
      { secret: process.env.JWT_SECRET, expiresIn: accessExpiry },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: refreshExpiry },
    );

    return { accessToken, refreshToken, refreshExpiresAtSeconds, jti };
  }

  private async blacklistToken(jti: string, expiresAt: Date): Promise<void> {
    await this.db.insert(tokenBlacklist).values({ jti, expiresAt });
  }

  async loginAdmin(dto: AdminLoginDto): Promise<AdminLoginResult> {
    const rows = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, dto.email));

    const admin = rows[0];

    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const passwordMatch = await bcrypt.compare(dto.password, admin.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const { accessToken, refreshToken, refreshExpiresAtSeconds } = this.generateTokens({
      sub: admin.id,
      role: 'admin',
      email: admin.email,
    });

    return {
      accessToken,
      refreshToken,
      refreshExpiresAtSeconds,
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
    };
  }

  async loginCustomer(dto: CustomerLoginDto): Promise<CustomerLoginResult> {
    const rows = await this.db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.phone, dto.phone),
          eq(customers.isActive, true),
          isNull(customers.deletedAt),
        ),
      );

    const customer = rows[0];

    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    const passwordMatch = await bcrypt.compare(dto.password, customer.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    const { accessToken, refreshToken, refreshExpiresAtSeconds } = this.generateTokens({
      sub: customer.id,
      role: 'customer',
      phone: customer.phone,
      name: customer.fullName,
    });

    await this.db
      .update(customers)
      .set({ lastLoginAt: new Date() })
      .where(eq(customers.id, customer.id));

    return {
      accessToken,
      refreshToken,
      refreshExpiresAtSeconds,
      customer: { id: customer.id, phone: customer.phone, fullName: customer.fullName },
    };
  }

  async refresh(payload: JwtPayload, oldJti: string): Promise<RefreshResult> {
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date();
    await this.blacklistToken(oldJti, expiresAt);

    const payloadInput: TokenPayloadInput =
      payload.role === 'admin'
        ? { sub: payload.sub, role: 'admin', email: payload.email }
        : { sub: payload.sub, role: 'customer', phone: payload.phone, name: payload.name };

    const { accessToken, refreshToken, refreshExpiresAtSeconds } =
      this.generateTokens(payloadInput);

    return { accessToken, refreshToken, refreshExpiresAtSeconds };
  }

  async logout(jti: string, exp: number): Promise<void> {
    await this.blacklistToken(jti, new Date(exp * 1000));
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const rows = await this.db
      .select()
      .from(customers)
      .where(
        and(eq(customers.phone, dto.phone), eq(customers.isActive, true), isNull(customers.deletedAt)),
      );

    const customer = rows[0];

    if (!customer) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.db
      .update(customers)
      .set({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: tokenExpires,
      })
      .where(eq(customers.id, customer.id));

    if (!customer.email) {
      return;
    }

    await this.resend.emails.send({
      from: 'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
      to: customer.email,
      subject: 'Đặt lại mật khẩu',
      html: `<p>Nhấn vào link bên dưới để đặt lại mật khẩu của bạn. Link có hiệu lực trong ${PASSWORD_RESET_TOKEN_EXPIRY_HOURS} giờ.</p>
<p><a href="${process.env.APP_URL}/reset-password?token=${rawToken}">Đặt lại mật khẩu</a></p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>`,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const rows = await this.db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.passwordResetToken, hashedToken),
          gt(customers.passwordResetTokenExpires, new Date()),
          isNull(customers.deletedAt),
        ),
      );

    const customer = rows[0];

    if (!customer) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.db
      .update(customers)
      .set({
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      })
      .where(eq(customers.id, customer.id));

    if (!customer.email) {
      return;
    }

    await this.resend.emails.send({
      from: 'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
      to: customer.email,
      subject: 'Mật khẩu đã được đặt lại thành công',
      html: `<p>Mật khẩu tài khoản của bạn đã được đặt lại thành công.</p>
<p>Nếu bạn không thực hiện thao tác này, hãy liên hệ với chúng tôi ngay.</p>`,
    });
  }

  async inviteCustomer(dto: CustomerInviteDto): Promise<void> {
    const rows = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, dto.customerId), isNull(customers.deletedAt)));

    const customer = rows[0];

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(
      Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.db
      .update(customers)
      .set({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: tokenExpires,
      })
      .where(eq(customers.id, customer.id));

    if (!customer.email) {
      return;
    }

    await this.resend.emails.send({
      from: 'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
      to: customer.email,
      subject: 'Kích hoạt tài khoản Phòng Khám Thú Y Bác Sĩ Lục',
      html: `<p>Xin chào ${customer.fullName},</p>
<p>Bạn được mời tạo tài khoản trên hệ thống Phòng Khám Thú Y Bác Sĩ Lục.</p>
<p>Nhấn vào link bên dưới để thiết lập mật khẩu. Link có hiệu lực trong ${INVITE_TOKEN_EXPIRY_HOURS} giờ.</p>
<p><a href="${process.env.APP_URL}/set-password?token=${rawToken}">Thiết lập mật khẩu</a></p>`,
    });
  }

  async setPassword(dto: SetPasswordDto): Promise<CustomerLoginResult> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const rows = await this.db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.passwordResetToken, hashedToken),
          gt(customers.passwordResetTokenExpires, new Date()),
          isNull(customers.deletedAt),
        ),
      );

    const customer = rows[0];

    if (!customer) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const newHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    await this.db
      .update(customers)
      .set({
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        isActive: true,
      })
      .where(eq(customers.id, customer.id));

    const { accessToken, refreshToken, refreshExpiresAtSeconds } = this.generateTokens({
      sub: customer.id,
      role: 'customer',
      phone: customer.phone,
      name: customer.fullName,
    });

    return {
      accessToken,
      refreshToken,
      refreshExpiresAtSeconds,
      customer: { id: customer.id, phone: customer.phone, fullName: customer.fullName },
    };
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.db
      .delete(tokenBlacklist)
      .where(lt(tokenBlacklist.expiresAt, new Date()));
  }
}
