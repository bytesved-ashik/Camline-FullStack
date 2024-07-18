import { InjectModel } from '@nestjs/mongoose';
import { Availability } from '@entities/availability.entity';
import { IAvailabilityModel, IUserDocument } from '@interfaces';
import { CreateAvailabilityDto } from '@modules/availability/dto/create-availability.dto';
import { THERAPIST_AVAILABILITY } from '@modules/user/user.constant';

export class AvailabilityRepository {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: IAvailabilityModel,
  ) {}

  async createAvailability(
    user: IUserDocument,
    availabilityDto: CreateAvailabilityDto,
  ) {
    const is24HoursAvailable = availabilityDto.is24HoursAvailable;
    let availabilityData = availabilityDto.availability;

    if (is24HoursAvailable) {
      availabilityData = [];
    }

    const availability = await this.availabilityModel.findOneAndUpdate(
      { userId: user.id },
      { is24HoursAvailable, availability: availabilityData, userId: user.id },
      { new: true, upsert: true },
    );

    return availability;
  }

  async getAvailability(therapistId: string) {
    const availability = await this.availabilityModel.findOne({
      _id: therapistId,
    });

    return availability;
  }

  async defaultAvailability(user: IUserDocument) {
    const is24HoursAvailable = THERAPIST_AVAILABILITY;
    let availabilityData;

    if (is24HoursAvailable) {
      availabilityData = [];
    }

    const availability = await this.availabilityModel.findOneAndUpdate(
      { userId: user.id },
      { is24HoursAvailable, availability: availabilityData, userId: user.id },
      { new: true, upsert: true },
    );

    return availability;
  }
}
