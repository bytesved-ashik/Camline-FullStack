import { Injectable } from '@nestjs/common';
import { SubscriptionPlanDto } from './dto/createSubscriptionPlan.dto';
import { SubscriptionPlanRepository } from '@repositories/subscriptionPlan.repository';
import { ISubscriptionPlanDocument } from 'src/types/interfaces/entities/subscriptionPlan.interface';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { UpdateSubscriptionPlanDto } from './dto/updateSubscriptionPlan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async createSubscriptionPlan(subscriptionPlanDto: SubscriptionPlanDto) {
    const createSubscriptionPlan =
      await this.subscriptionPlanRepository.createSubscriptionPlan(
        subscriptionPlanDto,
      );
    return createSubscriptionPlan;
  }

  async getAllSubscriptionPlan(
    filter: FilterQuery<ISubscriptionPlanDocument>,
    options: PaginateOptions,
  ) {
    const getAllSubscriptionPlan =
      await this.subscriptionPlanRepository.getAllSubscriptionPlan(
        filter,
        options,
      );
    return getAllSubscriptionPlan;
  }

  async updateSubscriptionPlan(dto: UpdateSubscriptionPlanDto) {
    const createSubscriptionPlan =
      await this.subscriptionPlanRepository.updateSubscriptionPlan(dto);
    return createSubscriptionPlan;
  }
}
