import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_, req) => {
  const user = req.user;
  return user;
});
