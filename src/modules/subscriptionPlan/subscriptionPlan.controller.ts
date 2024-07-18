import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery } from 'mongoose';
import { Response } from 'express';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { SubscriptionPlanService } from './subscriptionPlan.service';
import { SubscriptionPlanDto } from './dto/createSubscriptionPlan.dto';
import { ROLE } from 'src/types/enums';
import { RolesGuard } from '@classes/role.guard';
import { Roles } from '@decorators/role.decorator';
import { GetQueryDto } from '@dto/getQuery.dto';
import { DEFAULT_PAGE, DEFAULT_SORT, LIMIT_PER_PAGE } from '@constants/index';
import { ISubscriptionPlanDocument } from 'src/types/interfaces/entities/subscriptionPlan.interface';
import { UpdateSubscriptionPlanDto } from './dto/updateSubscriptionPlan.dto';

@ApiTags('Subscription plan')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @ApiOperation({
    description: 'Create subscription plan.',
  })
  async create(
    @Body() subscriptionPlanDto: SubscriptionPlanDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const subscriptionPlan =
        await this.subscriptionPlanService.createSubscriptionPlan(
          subscriptionPlanDto,
        );
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        subscriptionPlan: subscriptionPlan,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    description: 'Get subscription plan.',
  })
  async getAllSubscriptionPlan(@Query() query: GetQueryDto) {
    const { limit, page, sort } = query;

    const options: any = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
    };

    let filter: FilterQuery<ISubscriptionPlanDocument>;

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }

    const users = await this.subscriptionPlanService.getAllSubscriptionPlan(
      filter,
      options,
    );
    return users;
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/update')
  @ApiOperation({
    description: 'Update subscription plan.',
  })
  async updateSubscriptionPlan(
    @Body() dto: UpdateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const subscriptionPlan =
        await this.subscriptionPlanService.updateSubscriptionPlan(dto);
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        subscriptionPlan: subscriptionPlan,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
