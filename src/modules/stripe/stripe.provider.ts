import { Provider } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { STRIPE_CLIENT } from '@constants';
import Stripe from 'stripe';

export const StripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  useFactory: (configService: ConfigService) => {
    const stripeConfig = configService.getStripeConfig();
    const secretKey = stripeConfig.secretKey;

    const gateway = new Stripe(secretKey, {
      apiVersion: '2022-11-15',
    });
    return gateway;
  },
  inject: [ConfigService],
};
