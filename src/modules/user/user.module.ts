import toJSON from '@entities/plugins/toJSON.plugin';
import validSlugGenerator from '@entities/plugins/validSlugGenerator';
import { Wallet } from '@entities/wallet.entity';
import { WalletSchema } from '@entities/wallet.entity';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as paginate from 'mongoose-paginate-v2';
import { User, UserSchema } from '@entities/user.entity';
import { UserRepository } from '@repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfile, UserProfileSchema } from '@entities/user-profile.entity';
import {
  TherapistProfile,
  TherapistProfileSchema,
} from '@entities/therapist-profile.entity';
import { SettingsRepository } from '@repositories/settings.repository';
import { SettingsModule } from '@modules/settings/settings.module';
import { MediaModule } from '@modules/media/media.module';
import {
  Availability,
  AvailabilitySchema,
} from '@entities/availability.entity';
import { AvailabilityService } from '@modules/availability/availability.service';
import { AvailabilityRepository } from '@repositories/availability.repository';
import {
  ShortlistedTherapists,
  ShortlistedTherapistsSchema,
} from '@entities/shortlistedTherapist.entity';
import { ShortlistedTherapistRepository } from '@repositories/shortlistedTherapist.repository';
import { ShortlistedTherapistService } from '@modules/shortlistedTherapists/shortlistedTherapist.service';
import { ChatsModule } from '@modules/chats/chat.module';
import { Referral, ReferralSchema } from '@entities/user-referral.entity';
import { Token, TokenSchema } from '@entities/token.entity';
import { TokenService } from '@modules/token/token.service';
import { TokenRepository } from '@repositories/token.repository';
import { Category, CategorySchema } from '@entities/category.entity';
import {
  SystemReferralCode,
  SystemReferralCodeSchema,
} from '@entities/systemReferralCode.entity';
import {
  SystemConfig,
  SystemConfigSchema,
} from '@entities/systemConfig.entity';
import { SystemConfigRepository } from '@repositories/systemConfig.repository';
import {
  TwoFactorAuth,
  TwoFactorAuthSchema,
} from '@entities/twoFactorAuth.entity';
import { Media, MediaSchema } from '@entities/media.entity';
import { SessionService } from '@modules/session/session.service';
import { SessionRepository } from '@repositories/session.repository';
import { SessionModule } from '@modules/session/session.module';
import { Session, SessionSchema } from '@entities/session.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          UserSchema.pre('save', async function () {
            if (this.isModified('password')) {
              this.password = await bcrypt.hash(this.password, 8);
            }
          });

          UserSchema.static(
            'isEmailTaken',
            async function (email: string): Promise<boolean> {
              const user = await this.findOne({
                email: { $regex: new RegExp(`^${email}$`, 'i') },
              });
              return !!user;
            },
          );

          UserSchema.method(
            'comparePassword',
            async function (password: string): Promise<boolean> {
              return await bcrypt.compare(password, this.password);
            },
          );

          UserSchema.virtual('name').get(function () {
            return `${this.firstName} ${this.lastName}`;
          });

          UserSchema.plugin(paginate);
          UserSchema.plugin(toJSON);
          UserSchema.plugin(validSlugGenerator);

          return UserSchema;
        },
      },
      {
        name: Wallet.name,
        useFactory: () => {
          return WalletSchema;
        },
      },
      {
        name: UserProfile.name,
        useFactory: () => {
          return UserProfileSchema;
        },
      },
      {
        name: TherapistProfile.name,
        imports: [forwardRef(() => SettingsModule)],
        useFactory: async (settingsRepository: SettingsRepository) => {
          TherapistProfileSchema.method(
            'getDeductionPercentage',
            async function () {
              if (this.deductionPercentage) {
                return parseInt(this.deductionPercentage);
              }
              const percentage = await settingsRepository.getSettingByKey(
                'deductionPercentage',
              );
              if (percentage) {
                return parseInt(percentage.value);
              }
              return 10;
            },
          );
          return TherapistProfileSchema;
        },
        inject: [SettingsRepository],
      },
      {
        name: Availability.name,
        useFactory: () => {
          return AvailabilitySchema;
        },
      },
      {
        name: ShortlistedTherapists.name,
        useFactory: () => {
          return ShortlistedTherapistsSchema;
        },
      },
      {
        name: Referral.name,
        useFactory: () => {
          return ReferralSchema;
        },
      },
      {
        name: Token.name,
        useFactory: () => {
          return TokenSchema;
        },
      },
      {
        name: Category.name,
        useFactory: () => {
          return CategorySchema;
        },
      },
      {
        name: SystemReferralCode.name,
        useFactory: () => {
          return SystemReferralCodeSchema;
        },
      },
      {
        name: SystemConfig.name,
        useFactory: () => {
          return SystemConfigSchema;
        },
      },
      {
        name: TwoFactorAuth.name,
        useFactory: () => {
          return TwoFactorAuthSchema;
        },
      },
      {
        name: Media.name,
        useFactory: () => {
          return MediaSchema;
        },
      },
      {
        name: Session.name,
        useFactory: () => {
          return SessionSchema;
        },
      },
    ]),
    forwardRef(() => MediaModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => SessionModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    AvailabilityService,
    AvailabilityRepository,
    ShortlistedTherapistRepository,
    ShortlistedTherapistService,
    TokenService,
    TokenRepository,
    SystemConfigRepository,
  ],
  exports: [
    UserRepository,
    UserService,
    AvailabilityService,
    AvailabilityRepository,
    ShortlistedTherapistRepository,
    ShortlistedTherapistService,
    TokenService,
    TokenRepository,
    SystemConfigRepository,
  ],
})
export class UserModule {}
