import { Inject } from '@nestjs/common';
import { PAYPAL_CLIENT } from '@constants';

export function InjectPaypal() {
  return Inject(PAYPAL_CLIENT);
}
