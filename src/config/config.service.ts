import * as dotenv from 'dotenv';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as qs from 'querystring';
import { v4 as uuidv4 } from 'uuid';

export class ConfigService {
  private readonly envConfig: Record<string, string>;
  constructor() {
    const result = dotenv.config();

    if (result.error) {
      this.envConfig = process.env;
    } else {
      this.envConfig = result.parsed;
    }
  }

  public get(key: string): string {
    return this.envConfig[key];
  }

  public getPortConfig() {
    return this.get('PORT');
  }

  public getMongoConfig() {
    return {
      uri:
        this.get('MONGO_PROTOCOL') +
        this.get('MONGO_USER') +
        ':' +
        this.get('MONGO_PASSWORD') +
        '@' +
        this.get('MONGO_HOST') +
        '/' +
        this.get('MONGO_DATABASE') +
        '?retryWrites=true&w=majority',
    };
  }

  public getJwtConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      expiresIn: this.get('JWT_EXPIRATION_TIME'),
    };
  }

  public getRefreshTokenExpiresIn() {
    return this.get('REFRESH_EXPIRATION_TIME');
  }

  public getPaypalConfig() {
    return {
      braintree: {
        accessToken: this.get('BRAINTREE_ACCESS_TOKEN'),
      },
      paypal: {
        client_id: this.get('PAYPAL_CLIENT_ID'),
        client_secret: this.get('PAYPAL_CLIENT_SECRET'),
        mode: this.get('PAYPAL_ENVIRONMENT'),
        apiBaseUrl: this.get('PAYPAL_API_BASE_URL'),
      },
    };
  }

  public getStripeConfig() {
    return {
      secretKey: this.get('STRIPE_SECRET_KEY'),
      webhookSecret: this.get('STRIPE_WEBHOOK_SECRET'),
    };
  }

  public getPaypalAuthUrl(clientId: string, redirectUri: string): string {
    const state = uuidv4();
    const scope =
      'openid profile email https://uri.paypal.com/services/paypalattributes';
    const queryParams = qs.stringify({
      client_id: clientId,
      response_type: 'code',
      scope,
      state,
      redirect_uri: redirectUri,
    });
    const authUrl = `https://www.paypal.com/signin/authorize?${queryParams}`;
    return authUrl;
  }

  public getMailConfig() {
    return {
      transport: {
        host: this.get('MAIL_HOST'),
        port: +this.get('MAIL_PORT'),
        auth: {
          user: this.get('MAIL_USER'),
          pass: this.get('MAIL_PASSWORD'),
        },
      },
      defaults: {
        from: `"No Reply" <${this.get('MAIL_FROM')}>`,
      },
    } as SMTPTransport.Options;
  }

  public getCloudinaryConfig() {
    return {
      cloud_name: this.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.get('CLOUDINARY_API_KEY'),
      api_secret: this.get('CLOUDINARY_API_SECRET'),
    };
  }

  public getTwilioConfig() {
    return {
      accountSid: this.get('TWILIO_ACCOUNT_SID'),
      authToken: this.get('TWILIO_AUTH_TOKEN'),
      from: this.get('TWILIO_FROM_MOBILE'),
    };
  }
}
