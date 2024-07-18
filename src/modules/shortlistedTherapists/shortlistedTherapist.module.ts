import { Module } from '@nestjs/common';
import { ShortlistedTherapistsController } from './shortlistedTherapist.controller';
import { ShortlistedTherapistRepository } from '@repositories/shortlistedTherapist.repository';
import { ShortlistedTherapistService } from './shortlistedTherapist.service';
import {
  ShortlistedTherapists,
  ShortlistedTherapistsSchema,
} from '@entities/shortlistedTherapist.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '@modules/user/user.module';
import { ChatsModule } from '@modules/chats/chat.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: ShortlistedTherapists.name,
        useFactory: () => {
          return ShortlistedTherapistsSchema;
        },
      },
    ]),
    UserModule,
    ChatsModule,
  ],
  controllers: [ShortlistedTherapistsController],
  providers: [ShortlistedTherapistRepository, ShortlistedTherapistService],
  exports: [ShortlistedTherapistRepository, ShortlistedTherapistService],
})
export class ShortlistedTherapistModule {}
