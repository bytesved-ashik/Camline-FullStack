import { Inject } from '@nestjs/common';
import { STRIPE_CLIENT } from '@constants';

export function InjectStripe() {
  return Inject(STRIPE_CLIENT);
}
