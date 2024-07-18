import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityRepository } from '@repositories/availability.repository';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Availability,
  AvailabilitySchema,
} from '@entities/availability.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Availability.name,
        useFactory: () => {
          return AvailabilitySchema;
        },
      },
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository],
  exports: [AvailabilityService, AvailabilityRepository],
})
export class AvailabilityModule {}
