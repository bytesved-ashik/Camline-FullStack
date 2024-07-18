import { InjectStripe } from '@decorators/stripe.decorator';
import { Injectable, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from 'src/config/config.service';
import { IRequest } from 'src/types/interfaces';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(
    private readonly configService: ConfigService,
    @InjectStripe() readonly stripe: Stripe,
  ) {}
  constructEvent(req: RawBodyRequest<Request>): Stripe.Event {
    const sig = req.headers['stripe-signature'];
    const stripeSecret = this.configService.getStripeConfig();
    const endpointSecret = stripeSecret.webhookSecret;
    const event = this.stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      endpointSecret,
    );
    return event;
  }

  async createCustomer(user: IRequest['user']) {
    const customer = await this.stripe.customers.create({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });

    return customer;
  }

  async createPaymentIntent(param: Stripe.PaymentIntentCreateParams) {
    const paymentIntent = await this.stripe.paymentIntents.create(param);

    return paymentIntent;
  }

  async deletePaymentMethod(paymentMethodId: string) {
    await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async isCustomerCustomerIdExists(customerId: string) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
