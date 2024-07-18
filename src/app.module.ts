import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { TokenModule } from '@modules/token/token.module';
import { MediaModule } from '@modules/media/media.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SocketModule } from '@modules/socket/socket.module';
import { SessionModule } from '@modules/session/session.module';
import { CategoryModule } from '@modules/category/category.module';
import { QuestionModule } from '@modules/question/question.module';
import { ChatsModule } from '@modules/chats/chat.module';
import { SessionRequestModule } from '@modules/sessionRequest/request.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { MailModule } from '@modules/mail/mail.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SeedsModule } from '@modules/shared/seeds.module';
import { BlogModule } from '@modules/blog/blog.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { CallHistoryModule } from '@modules/callHistory/call-history.module';
import { ShortlistedTherapistModule } from '@modules/shortlistedTherapists/shortlistedTherapist.module';
import { NotesModule } from '@modules/notes/notes.module';
import { DatabaseScriptModule } from '@modules/databaseScripts/database-script.module';
import { AgendaModule } from '@agent-ly/nestjs-agenda';
import { AppProcessor } from '@utils/agenda.utils';
import { WALLET_CONSTANT } from './constants';
import { InterestModule } from '@modules/interest/interest.module';
import { SubscriptionPlanModule } from '@modules/subscriptionPlan/subscriptionPlan.module';
import { TwilioMessageModule } from '@modules/twilio/twilio.module';
import { SystemConfigModule } from '@modules/systemConfig/systemConfig.module';
import { ErrorLogModule } from '@modules/errorLog/errorLog.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '@modules/errorLog/errorLog.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getMongoConfig(),
    }),
    ScheduleModule.forRoot(),
    ConfigModule,
    AuthModule,
    SocketModule,
    SettingsModule,
    MediaModule,
    StripeModule,
    ChatsModule,
    SessionModule,
    QuestionModule,
    SessionRequestModule,
    UserModule,
    TokenModule,
    CategoryModule,
    WalletModule,
    MailModule,
    SeedsModule,
    BlogModule,
    AvailabilityModule,
    CallHistoryModule,
    ShortlistedTherapistModule,
    NotesModule,
    DatabaseScriptModule,
    SubscriptionPlanModule,
    TwilioMessageModule,
    SystemConfigModule,
    // ErrorLogModule,
    AgendaModule.forRoot({
      db: {
        address: WALLET_CONSTANT.AGENDA_DB_URL,
      },
    }),
    InterestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppProcessor,
    // {
    //   provide: APP_FILTER,
    //   useClass: AllExceptionsFilter,
    // },
  ],
})
export class AppModule {}
