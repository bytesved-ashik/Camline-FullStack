import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from '@repositories/settings.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from '@entities/settings.entity';
import * as paginate from 'mongoose-paginate-v2';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Settings.name,
        useFactory: () => {
          SettingsSchema.plugin(paginate);
          return SettingsSchema;
        },
      },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsRepository, SettingsService],
})
export class SettingsModule {}
