import { Module } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { TwilioMessageService } from './twilio.service';
import { TwilioModule } from 'nestjs-twilio';
import { ConfigModule } from 'src/config/config.module';

@Module({
  imports: [
    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        accountSid: configService.getTwilioConfig().accountSid,
        authToken: configService.getTwilioConfig().authToken,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TwilioMessageService],
  exports: [TwilioMessageService],
})
export class TwilioMessageModule {}
