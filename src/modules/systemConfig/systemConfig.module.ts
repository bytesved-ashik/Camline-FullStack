import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfigService } from './systemConfig.service';
import { SystemConfigRepository } from '@repositories/systemConfig.repository';
import {
  SystemConfig,
  SystemConfigSchema,
} from '@entities/systemConfig.entity';
import { SystemConfigController } from './systemConfig.controller';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: SystemConfig.name,
        useFactory: () => {
          return SystemConfigSchema;
        },
      },
    ]),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService, SystemConfigRepository],
  exports: [SystemConfigService, SystemConfigRepository],
})
export class SystemConfigModule {}
