import { Module } from '@nestjs/common';
import { DatabaseScriptController } from './database-script.controller';
import { DatabaseScriptService } from './database-script.service';
import { Chat, ChatSchema } from '@entities/chat.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Availability,
  AvailabilitySchema,
} from '@entities/availability.entity';
import { Blog, BlogSchema } from '@entities/blog.entity';
import { CallHistory, CallHistorySchema } from '@entities/call-history.entity';
import { Category, CategorySchema } from '@entities/category.entity';
import { Media, MediaSchema } from '@entities/media.entity';
import { Message, MessageSchema } from '@entities/message.entity';
import { Notes, NotesSchema } from '@entities/notes.entity';
import { Question, QuestionSchema } from '@entities/question.entity';
import { SessionRequest, SessionRequestSchema } from '@entities/request.entity';
import { Session, SessionSchema } from '@entities/session.entity';
import {
  ShortlistedTherapists,
  ShortlistedTherapistsSchema,
} from '@entities/shortlistedTherapist.entity';
import {
  TherapistProfile,
  TherapistProfileSchema,
} from '@entities/therapist-profile.entity';
import { Token, TokenSchema } from '@entities/token.entity';
import { Transaction, TransactionSchema } from '@entities/transaction.entity';
import { UserProfile, UserProfileSchema } from '@entities/user-profile.entity';
import { User, UserSchema } from '@entities/user.entity';
import { Wallet, WalletSchema } from '@entities/wallet.entity';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '@entities/subscriptions.entity';
import { Referral, ReferralSchema } from '@entities/user-referral.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Availability.name,
        useFactory: () => {
          return AvailabilitySchema;
        },
      },

      {
        name: Blog.name,
        useFactory: () => {
          return BlogSchema;
        },
      },
      {
        name: CallHistory.name,
        useFactory: () => {
          return CallHistorySchema;
        },
      },

      {
        name: Category.name,
        useFactory: () => {
          return CategorySchema;
        },
      },
      {
        name: Chat.name,
        useFactory: () => {
          return ChatSchema;
        },
      },

      {
        name: Media.name,
        useFactory: () => {
          return MediaSchema;
        },
      },
      {
        name: Message.name,
        useFactory: () => {
          return MessageSchema;
        },
      },

      {
        name: Notes.name,
        useFactory: () => {
          return NotesSchema;
        },
      },
      {
        name: Question.name,
        useFactory: () => {
          return QuestionSchema;
        },
      },

      {
        name: SessionRequest.name,
        useFactory: () => {
          return SessionRequestSchema;
        },
      },
      {
        name: Session.name,
        useFactory: () => {
          return SessionSchema;
        },
      },

      {
        name: ShortlistedTherapists.name,
        useFactory: () => {
          return ShortlistedTherapistsSchema;
        },
      },
      {
        name: Subscriptions.name,
        useFactory: () => {
          return SubscriptionsSchema;
        },
      },
      {
        name: TherapistProfile.name,
        useFactory: () => {
          return TherapistProfileSchema;
        },
      },

      {
        name: Token.name,
        useFactory: () => {
          return TokenSchema;
        },
      },
      {
        name: Transaction.name,
        useFactory: () => {
          return TransactionSchema;
        },
      },

      {
        name: UserProfile.name,
        useFactory: () => {
          return UserProfileSchema;
        },
      },
      {
        name: User.name,
        useFactory: () => {
          return UserSchema;
        },
      },

      {
        name: Referral.name,
        useFactory: () => {
          return ReferralSchema;
        },
      },
      {
        name: Wallet.name,
        useFactory: () => {
          return WalletSchema;
        },
      },
    ]),
  ],
  controllers: [DatabaseScriptController],
  providers: [DatabaseScriptService],
  exports: [DatabaseScriptService],
})
export class DatabaseScriptModule {}
