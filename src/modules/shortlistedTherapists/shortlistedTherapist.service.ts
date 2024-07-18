import { Injectable } from '@nestjs/common';
import { ShortlistedTherapistRepository } from '@repositories/shortlistedTherapist.repository';

@Injectable()
export class ShortlistedTherapistService {
  constructor(
    private readonly shortlistedTherapistRepository: ShortlistedTherapistRepository,
  ) {}

  async createShortlistTherapist(userId: string, therapistId: string) {
    const shortlist =
      await this.shortlistedTherapistRepository.createShortlistTherapist(
        userId,
        therapistId,
      );

    return shortlist;
  }

  async getShortlistedTherapists(userId: string) {
    const shortlist =
      await this.shortlistedTherapistRepository.getShortlistedTherapists(
        userId,
      );

    return shortlist;
  }
}
