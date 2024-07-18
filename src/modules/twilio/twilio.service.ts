import { Injectable } from '@nestjs/common';
import { TwilioService } from 'nestjs-twilio';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@events';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class TwilioMessageService {
  public constructor(
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(events.SMS_SEND, { async: true })
  async sendSMS({ phoneNumbers }) {
    try {
      const fromMobile = this.configService.getTwilioConfig().from;
      const smsResult = [];

      if (phoneNumbers.length > 0) {
        for (let i = 0; i < phoneNumbers.length; i++) {
          let phoneNumber = phoneNumbers[i];

          const phoneNumberLength = phoneNumber.length;

          if (phoneNumberLength > 10) {
            phoneNumber = phoneNumber.substr(phoneNumberLength - 10);
            phoneNumber = '+44' + phoneNumber;
          }

          console.log(
            'Send message from twilio service : phoneNumber : fromMobile',
            phoneNumber,
            fromMobile,
          );

          const result = await this.twilioService.client.messages.create({
            body: 'There is a customer waiting on 24 hour therapy platform. Please accept the call and proceed with the session.',
            from: fromMobile,
            to: phoneNumber,
          });

          const resultObj = { phoneNumber, result };

          smsResult.push(resultObj);
        }
      }

      console.log('sms result: ', smsResult);
    } catch (error) {
      console.log('Twilio service send message error: ', error);
    }
  }

  @OnEvent(events.CUSTOM_SMS_SEND, { async: true })
  async sendCustomSMS({ phoneNumbers, body }) {
    try {
      const fromMobile = this.configService.getTwilioConfig().from;
      const smsResult = [];

      if (phoneNumbers.length > 0) {
        for (let i = 0; i < phoneNumbers.length; i++) {
          let phoneNumber = phoneNumbers[i];

          const phoneNumberLength = phoneNumber.length;

          if (phoneNumberLength > 10) {
            phoneNumber = phoneNumber.substr(phoneNumberLength - 10);
            phoneNumber = '+44' + phoneNumber;
          }

          const result = await this.twilioService.client.messages.create({
            body: body,
            from: fromMobile,
            to: phoneNumber,
          });

          const resultObj = { phoneNumber, result };

          smsResult.push(resultObj);
        }
      }
    } catch (error) {
      console.log('Twilio service send custom message error: ', error);
    }
  }
}
