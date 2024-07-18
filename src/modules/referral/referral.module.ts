import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Referral, ReferralSchema } from '@entities/user-referral.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Referral.name,
        useFactory: () => {
          return ReferralSchema;
        },
      },
    ]),
  ],
})
export class ReferralModule {}
