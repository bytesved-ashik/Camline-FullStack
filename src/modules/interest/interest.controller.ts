import { Controller, UseGuards, Get, Post, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { InterestService } from './interest.service';
import { CreateInterestDto } from './dto/createInterest.dto';
import { ROLE } from '@enums';
import { RolesGuard } from '@classes/role.guard';
import { Roles } from '@decorators/role.decorator';
import { GetQueryDto } from '@dto/getQuery.dto';
import { FilterQuery } from 'mongoose';
import { IInterestDocument } from 'src/types/interfaces';
import { pick } from '@utils/object.util';
import * as moment from 'moment';

@ApiTags('Interest')
@Controller('interest')
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @ApiBearerAuth()
  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({
    description: 'Get all interests',
  })
  async getAllInterests(@Query() query: GetQueryDto) {
    const options = pick(query, [
      'limit',
      'page',
      'sort',
      'pagination',
      'startDate',
      'endDate',
    ]);

    let filter: FilterQuery<IInterestDocument>;
    if (query.q) {
      filter = {
        $or: [
          { name: { $regex: query.q, $options: 'i' } },
          { email: { $regex: query.q, $options: 'i' } },
        ],
      };
    }

    if (options.startDate && options.endDate) {
      filter = {
        ...filter,
        createdAt: {
          $gte: moment(options.startDate).startOf('day').toDate(),
          $lte: moment(options.endDate).endOf('day').toDate(),
        },
      };
    }

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    const users = await this.interestService.getAll(filter, options);
    return users;
  }

  @Post()
  @ApiOperation({
    description: 'Create interest',
  })
  async createInterest(@Body() body: CreateInterestDto) {
    const interest = await this.interestService.createInterest(body);
    return interest;
  }

  /* @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get('/:id')
  @ApiOperation({
    description: 'Get interest by id',
  })
  async getInterest(@Param('id') id: string) {
    const interest = await this.interestService.getInterestById(id);
    return interest;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch('/:id')
  @ApiOperation({
    description: 'Update interest by id',
  })
  async updateInterest(
    @Param('id') id: string,
    @Body() body: CreateInterestDto,
  ) {
    const interest = await this.interestService.updateInterest(id, body);
    return interest;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete('/:id')
  @ApiOperation({
    description: 'Delete interest',
  })
  async deleteInterest(@Param('id') id: string) {
    const interest = await this.interestService.deleteInterest(id);
    return interest;
  } */
}
