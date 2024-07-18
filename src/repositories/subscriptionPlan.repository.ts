import { InjectModel } from '@nestjs/mongoose';
import {
  ISubscriptionPlanDocument,
  ISubscriptionPlanModel,
} from 'src/types/interfaces/entities/subscriptionPlan.interface';
import { SubscriptionPlan } from '@entities/subscriptionPlan.entity';
import { SubscriptionPlanDto } from '@modules/subscriptionPlan/dto/createSubscriptionPlan.dto';
import { BadRequestException } from '@nestjs/common';
import { SESSION_CONSTANT } from '@constants/index';
import { FilterQuery, PaginateOptions, PaginateResult } from 'mongoose';
import { UpdateSubscriptionPlanDto } from '@modules/subscriptionPlan/dto/updateSubscriptionPlan.dto';

export class SubscriptionPlanRepository {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: ISubscriptionPlanModel,
  ) {}

  async createSubscriptionPlan(subscriptionPlanDto: SubscriptionPlanDto) {
    const existingSubPlan = await this.subscriptionPlanModel.findOne({
      subscriptionName: {
        $regex: new RegExp(
          subscriptionPlanDto.subscriptionName.toLowerCase(),
          'i',
        ),
      },
    });

    if (existingSubPlan) {
      throw new BadRequestException('Plan name already exists.');
    }

    const perMinuteCharge = subscriptionPlanDto.hourlyCharge / 60;

    const singleSessionPrice =
      subscriptionPlanDto.sessionDurationMinutes * perMinuteCharge;

    const subscriptionPrice =
      subscriptionPlanDto.numberOfSession * singleSessionPrice;

    const VATCharge =
      (subscriptionPrice * SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE) / 100;

    const createSubPlan = new this.subscriptionPlanModel({
      ...subscriptionPlanDto,
      perMinuteCharge,
      subscriptionPrice,
      VATCharge,
    });

    return await createSubPlan.save();
  }

  async getAllSubscriptionPlan(
    filter: FilterQuery<ISubscriptionPlanDocument>,
    options: PaginateOptions,
  ) {
    const projects: PaginateResult<ISubscriptionPlanDocument> =
      await this.subscriptionPlanModel.paginate(filter, options);
    return projects;
  }

  async updateSubscriptionPlan(dto: UpdateSubscriptionPlanDto) {
    const subscriptionPlanId = dto.subscriptionPlanId;

    const subscriptionExists = await this.subscriptionPlanModel.findOne({
      _id: subscriptionPlanId,
    });

    if (!subscriptionExists) {
      throw new BadRequestException('Plan does not exists.');
    }

    const existingSubPlan = await this.subscriptionPlanModel.findOne({
      _id: { $ne: subscriptionPlanId },
      subscriptionName: {
        $regex: new RegExp(dto.subscriptionName.toLowerCase(), 'i'),
      },
    });

    if (existingSubPlan) {
      throw new BadRequestException('Plan name already exists.');
    }

    const perMinuteCharge = dto.hourlyCharge / 60;

    const singleSessionPrice = dto.sessionDurationMinutes * perMinuteCharge;

    const subscriptionPrice = dto.numberOfSession * singleSessionPrice;

    const VATCharge =
      (subscriptionPrice * SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE) / 100;

    const updatedSubPlan = await this.subscriptionPlanModel.findOneAndUpdate(
      { _id: dto.subscriptionPlanId },
      {
        ...dto,
        perMinuteCharge,
        subscriptionPrice,
        VATCharge,
      },
      { new: true },
    );

    return updatedSubPlan;
  }
}
