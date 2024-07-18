import { ConfigService } from '../config/config.service';
const configService = new ConfigService();
const mongodb = configService.getMongoConfig();

export const LIMIT_PER_PAGE = 10;
export const DEFAULT_SORT = 'createdAt:desc';
export const DEFAULT_PAGE = 1;
export const PAYPAL_CLIENT = 'PAYPAL_CLIENT';
export const STRIPE_CLIENT = 'STRIPE_CLIENT';
export const CLOUDINARY = 'Cloudinary';

export const SESSION_CONSTANT = {
  COMMISSITION_PERCENTAGE: 50,
  VAT_CHARGE_PERCENTAGE: 20,
  MAX_FREE_TRIALS_CALLS: 3,
};

export const WALLET_CONSTANT = {
  WEEKLY_WITHDRAW_DAY: 5,
  AGENDA_DB_URL: mongodb.uri,
  WITHDRAW_REQUEST_DAY: 5,
  FREE_TRIAL_MINUTE: 0,
  CHECK_TOPUP_AMOUNT: 15,
  TOP_UP_DISCOUNT_CODE: 'FLAT10',
  TOP_UP_DISCOUNT_PERCENTAGE: 10,
};

export const REQUEST_TIMES = {
  MIN_TIME: 5,
  MAX_TIME: 15,
};

export const TOKEN_EXPIRES_IN_HOURS = 72;
