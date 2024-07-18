import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { InjectStripe } from '@decorators/stripe.decorator';
import {
  Controller,
  Post,
  BadRequestException,
  Req,
  Body,
  UseGuards,
  Query,
  Get,
  RawBodyRequest,
  Delete,
  Res,
  Render,
  Param,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Connection } from 'mongoose';
import {
  IRequest,
  ISubscriptionPlanModel,
  ISubscriptionUserModel,
} from 'src/types/interfaces';
import Stripe from 'stripe';
import { WalletService } from '../wallet/wallet.service';
import { StripeClientSecretDto } from './dto/clientSecret.dto';
import { DetachPaymentMethodDto } from './dto/detachPaymentMethod.dto';
import { StripeService } from './stripe.service';
import { SESSION_CONSTANT, WALLET_CONSTANT } from '@constants/index';
import { Roles } from '@decorators/role.decorator';
import { RolesGuard } from '@classes/role.guard';
import { PurchaseSubscriptionDto } from './dto/createSubscriptionUser.dto';
import { SubscriptionPlan } from '@entities/subscriptionPlan.entity';
import { ROLE } from 'src/types/enums';
import { SubscriptionUser } from '@entities/subscriptionUser.entity';
import { IUserRedeemedCouponCodeModel } from 'src/types/interfaces/entities/userRedeemedCouponCode.interface';
import { UserRedeemedCouponCode } from '@entities/userReedemedCouponCode.entity';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
    @InjectConnection() private readonly mongoConnection: Connection,
    @InjectStripe() readonly stripe: Stripe,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: ISubscriptionPlanModel,
    @InjectModel(SubscriptionUser.name)
    private readonly subscriptionUserModel: ISubscriptionUserModel,
    @InjectModel(UserRedeemedCouponCode.name)
    private readonly userRedeemedCodeModel: IUserRedeemedCouponCodeModel,
  ) {}

  @Post('webhook')
  async handlePayoutNotification(@Req() req: RawBodyRequest<Request>) {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEvent(req);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    const session = await this.mongoConnection.startSession();

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('payment succeeded');
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const { customer, metadata } = paymentIntent;
        let { amount } = paymentIntent;
        if (
          metadata.isSubscriptionPlanPurchase &&
          metadata.isSubscriptionPlanPurchase == 'true'
        ) {
          console.log('subscription flow');

          const subscriptionPlan = await this.subscriptionPlanModel.findOne({
            _id: metadata.subscriptionPlanId,
          });

          const subscriptionUser = new this.subscriptionUserModel({
            userId: metadata.userId,
            subscriptionPlanId: metadata.subscriptionPlanId,
            remainingSession: metadata.numberOfSession,
            VATCharge: metadata.VATCharge,
            subscriptionPlanData: {
              ...subscriptionPlan,
            },
          });
          await subscriptionUser.save();

          await this.walletService.createSubscriptionRecord(
            metadata.userId,
            amount,
            paymentIntent.id,
            Number(metadata.VATCharge),
            session,
          );
        } else {
          const isDiscountGiven = metadata.isDiscountGiven;
          const availableVATCharge = Number(metadata.availableVATCharge);

          // TODO: Handle currency conversion
          const wallet = await this.walletService.getWalletByStripeCustomerId(
            customer as string,
          );

          let userRedeemedCouponCodeId = null;

          //  discount flow
          if (isDiscountGiven == 'true') {
            const discountAmount = metadata.discountAmount;
            amount = amount + Number(discountAmount);

            const userRedeem = new this.userRedeemedCodeModel({
              userId: wallet.user._id.toHexString(),
              couponCode: metadata.couponCode,
              stripeTransactionId: paymentIntent.id,
            });

            await userRedeem.save({ session });

            userRedeemedCouponCodeId = userRedeem._id;
          }

          const mainAmount: number = amount - availableVATCharge;

          await this.walletService.addWalletBalance(
            wallet.user._id.toHexString(),
            mainAmount / 100,
            paymentIntent.id,
            session,
            userRedeemedCouponCodeId,
          );
        }

        break;
      case 'payment_method.attached':
        // const paymentMethod = event.data.object as Stripe.PaymentMethod;
        event.data.object as Stripe.PaymentMethod;
        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        const { customer: customerFailed } = paymentIntentFailed;
        // TODO: Create failed transaction as well.
        // const walletFailed =
        //   await this.walletService.getWalletByStripeCustomerId(
        //     customerFailed as string,
        //   );
        await this.walletService.getWalletByStripeCustomerId(
          customerFailed as string,
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  @Get('/test/:clientSecret')
  @Render('stripe.payment.test.ejs')
  async openTestPaymentPage(
    @Res() res: Response,
    @Param('clientSecret') clientSecret: string,
  ) {
    return {
      data: {
        title: 'Stripe Test',
        message: 'Testing on stripe',
        clientSecret: clientSecret,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('client_secret')
  async getClientSecret(
    @Req() req: IRequest,
    @Body() body: StripeClientSecretDto,
  ) {
    const user = req.user;
    const wallet = await this.walletService.getWalletByUserId(user._id);
    const { couponCode } = body;

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    let isDiscountGiven = 'false';

    if (couponCode) {
      if (couponCode != WALLET_CONSTANT.TOP_UP_DISCOUNT_CODE) {
        throw new BadRequestException('Invalid coupon code');
      }

      // check is already counpon code redeemed or not
      const isAlreadyRedeemed = await this.userRedeemedCodeModel.findOne({
        userId: req.user._id,
        couponCode: couponCode,
      });

      if (isAlreadyRedeemed) {
        throw new BadRequestException('Coupon code already used');
      } else {
        isDiscountGiven = 'true';
      }
    }

    const isCustomerExists =
      await this.stripeService.isCustomerCustomerIdExists(
        wallet.stripeCustomerId,
      );

    if (!isCustomerExists) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    const { saveCard } = body;
    let { amount } = body;
    const availableVATCharge: number =
      (amount * SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE) / 100;
    const withoutDiscountAmount = amount;

    let discountPercentage = 0;
    let discountAmount = 0;

    if (isDiscountGiven == 'true') {
      discountPercentage = WALLET_CONSTANT.TOP_UP_DISCOUNT_PERCENTAGE;
      discountAmount = (amount * discountPercentage) / 100;
      amount = amount - discountAmount;
    }

    const paymentIntentOptions = {
      amount: amount + availableVATCharge,
      currency: 'GBP',
      customer: wallet.stripeCustomerId,
      metadata: {
        availableVATCharge: availableVATCharge,
        isDiscountGiven,
        discountPercentage,
        discountAmount,
        couponCode,
        withoutDiscountAmount,
      },
    };

    if (saveCard) {
      Object.assign(paymentIntentOptions, {
        setup_future_usage: 'on_session',
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      paymentIntentOptions,
    );

    return { clientSecret: paymentIntent.client_secret };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create_setup_intent')
  async createSetupIntent(@Req() req: IRequest) {
    const user = req.user;
    const wallet = await this.walletService.getWalletByUserId(user._id);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    const setupIntent = await this.stripe.setupIntents.create({
      payment_method_types: ['card', 'ideal'],
      customer: wallet.stripeCustomerId,
    });

    return { id: setupIntent.id, client_secret: setupIntent.client_secret };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('payment_methods')
  async listPaymentMethods(@Req() req: IRequest, @Query() query) {
    const user = req.user;
    const wallet = await this.walletService.getWalletByUserId(user._id);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: wallet.stripeCustomerId,
      type: query.type,
    });

    return paymentMethods;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('payment_methods')
  async detachPaymentMethod(
    @Req() req: IRequest,
    @Body() body: DetachPaymentMethodDto,
  ) {
    const user = req.user;
    const wallet = await this.walletService.getWalletByUserId(user._id);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    const paymentMethod = await this.stripe.paymentMethods.detach(
      body.paymentMethodId,
    );

    return paymentMethod;
  }

  //TODO: Test this
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Post('payout')
  // async payout(@Req() req: IRequest, @Body() body: StripeClientSecretDto) {
  //   const user = req.user;
  //   const wallet = await this.walletService.getWalletByUserId(user._id);
  //
  //   if (!wallet) {
  //     throw new BadRequestException('Wallet not found');
  //   }
  //
  //   if (!wallet.stripeCustomerId) {
  //     const customer = await this.stripeService.createCustomer(user);
  //     Object.assign(wallet, { stripeCustomerId: customer.id });
  //     await wallet.save();
  //   }
  //
  //   const { amount, currency } = body;
  //
  //   if (!wallet || wallet.mainBalance < amount) {
  //     throw new BadRequestException('Low balance');
  //   }
  //
  //   const session = await this.mongoConnection.startSession();
  //
  //   try {
  //     const payout = await this.stripe.payouts.create({
  //       amount,
  //       currency,
  //       method: 'instant',
  //     });
  //
  //     await this.walletService.withdrawWalletBalance(
  //       req.user._id,
  //       body.amount,
  //       payout.id,
  //       session,
  //     );
  //   } catch (err) {
  //     await session.abortTransaction();
  //     // TODO: Refund the user
  //     throw err;
  //   } finally {
  //     session.endSession();
  //   }
  //
  //   return { success: true };
  // }

  @Roles(ROLE.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/purchase')
  @ApiOperation({
    description: 'Purchase subscription user.',
  })
  async purchaseSubscription(
    @Body() purchaseSubscriptionDto: PurchaseSubscriptionDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    const subscriptionPlanId = purchaseSubscriptionDto.subscriptionPlanId;
    const subscriptionUser = await this.subscriptionUserModel.findOne({
      userId: user._id,
      remainingSession: { $gt: 0 },
    });

    if (subscriptionUser) {
      throw new BadRequestException('User have already subscription plan.');
    }

    const subscriptionPlan = await this.subscriptionPlanModel.findOne({
      _id: subscriptionPlanId,
    });

    if (!subscriptionPlan) {
      throw new BadRequestException('Invalid subscription Id.');
    }

    const wallet = await this.walletService.getWalletByUserId(user._id);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user);
      Object.assign(wallet, { stripeCustomerId: customer.id });
      await wallet.save();
    }

    let amount = Number(
      (subscriptionPlan.subscriptionPrice + subscriptionPlan.VATCharge) * 100,
    );

    amount = Math.round(amount);
    const VATChargeIn = subscriptionPlan.VATCharge * 100;

    const paymentIntentOptions = {
      amount: amount,
      currency: 'GBP',
      customer: wallet.stripeCustomerId,
      metadata: {
        userId: user._id.toString(),
        subscriptionPlanId: subscriptionPlanId.toString(),
        subscriptionPrice: subscriptionPlan.subscriptionPrice,
        numberOfSession: subscriptionPlan.numberOfSession,
        hourlyCharge: subscriptionPlan.hourlyCharge,
        isSubscriptionPlanPurchase: 'true',
        VATCharge: VATChargeIn,
      },
    };

    const paymentIntent = await this.stripeService.createPaymentIntent(
      paymentIntentOptions,
    );
    return { clientSecret: paymentIntent.client_secret };
  }
}
