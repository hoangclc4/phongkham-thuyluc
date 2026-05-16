import { SetMetadata } from '@nestjs/common';
import { ROLE_KEY } from '../../modules/auth/constants/auth.constants';

export type UserRole = 'admin' | 'customer';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);
