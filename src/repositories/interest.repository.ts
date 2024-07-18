import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, PaginateOptions, PaginateResult } from 'mongoose';

import { CreateInterestDto } from '@modules/interest/dto/createInterest.dto';
import { Interest } from '@entities/interest.entity';
import { IInterestDocument, IInterestModel } from '@interfaces';
import { ConflictException } from '@nestjs/common';

export class InterestRepository {
  constructor(
    @InjectModel(Interest.name) private readonly interestModel: IInterestModel,
  ) {}

  async createInterest(interestBody: CreateInterestDto) {
    try {
      const interest = await this.interestModel.create(interestBody);
      return interest;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email with selected role already exists');
      }
    }
  }

  async getAllInterests(
    filter: FilterQuery<IInterestDocument>,
    options: PaginateOptions,
  ) {
    const projects: PaginateResult<IInterestDocument> =
      await this.interestModel.paginate(filter, options);
    return projects;
  }

  async getInterestById(id: string) {
    return await this.interestModel.findById(id);
  }

  async updateInterest(id: string, interest: CreateInterestDto) {
    return await this.interestModel.findByIdAndUpdate(
      id,
      {
        $set: { ...interest },
      },
      { new: true },
    );
  }

  async deleteInterest(id: string) {
    return await this.interestModel.findByIdAndDelete(id);
  }
}
