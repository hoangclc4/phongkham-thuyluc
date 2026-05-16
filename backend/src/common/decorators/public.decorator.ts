import { SetMetadata } from '@nestjs/common';
import { PUBLIC_ROUTE_KEY } from '../../modules/auth/constants/auth.constants';

export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
