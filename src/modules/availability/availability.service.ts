import { Injectable } from '@nestjs/common';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { AvailabilityRepository } from '@repositories/availability.repository';
import { IUserDocument } from 'src/types/interfaces';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  async createAvailability(
    user: IUserDocument,
    createAvailabilityDto: CreateAvailabilityDto,
  ) {
    const availability = await this.availabilityRepository.createAvailability(
      user,
      createAvailabilityDto,
    );

    return availability;
  }

  async getAvailability(therapistId: string) {
    const availability = await this.availabilityRepository.getAvailability(
      therapistId,
    );

    return availability;
  }

  async defaultAvailability(user: IUserDocument) {
    const availability = await this.availabilityRepository.defaultAvailability(
      user,
    );

    return availability;
  }
}
