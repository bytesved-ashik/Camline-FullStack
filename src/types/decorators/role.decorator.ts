import { SetMetadata } from '@nestjs/common';
import { ROLE } from '@enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ROLE[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
