import { FilterQuery, PaginateOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';

import { InterestRepository } from '@repositories/interest.repository';

import { IInterestDocument } from 'src/types/interfaces';
import { CreateInterestDto } from './dto/createInterest.dto';

@Injectable()
export class InterestService {
  constructor(private readonly interestRepository: InterestRepository) {}

  async getAll(
    filter: FilterQuery<IInterestDocument>,
    options: PaginateOptions,
  ) {
    const interests = await this.interestRepository.getAllInterests(
      filter,
      options,
    );
    return interests;
  }
  async getInterestById(id: string) {
    const interest = await this.interestRepository.getInterestById(id);
    return interest;
  }

  async createInterest(body: CreateInterestDto) {
    const interest = await this.interestRepository.createInterest(body);
    return interest;
  }

  async updateInterest(id: string, body: CreateInterestDto) {
    const interest = await this.interestRepository.updateInterest(id, body);
    return interest;
  }

  async deleteInterest(id: string) {
    const interest = await this.interestRepository.deleteInterest(id);
    return interest;
  }
}
