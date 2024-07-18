import { Controller, UseGuards, Req, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery, PaginateOptions } from 'mongoose';
import { IRequest } from '@interfaces';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { CallHistoryService } from './call-history.service';
import { GetQueryDto } from '@dto/getQuery.dto';
import { colonToObject, pick } from '@utils/object.util';
import { ICallHistoryDocument } from '@interfaces';
import { Roles } from '@decorators/role.decorator';
import { ROLE } from 'src/types/enums';
import { RolesGuard } from '@classes/role.guard';

@ApiTags('CallHistory')
@Controller('call-history')
export class CallHistoryController {
  constructor(
    private readonly callHistoryService: CallHistoryService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Roles(ROLE.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({
    description: 'get users own call history',
  })
  async getCallHistories(@Query() query: GetQueryDto, @Req() req: IRequest) {
    try {
      const userId = req.user._id;
      const filter: FilterQuery<ICallHistoryDocument> = pick(query, ['q']);
      const options: PaginateOptions = pick(query, [
        'limit',
        'page',
        'sort',
        'pagination',
      ]);

      if (options.sort) {
        options.sort = colonToObject(options.sort as string);
      }

      filter.userId = userId;

      if (filter.q) {
        filter.name = { $regex: filter.q, $options: 'i' };
        delete filter.q;
      }

      const callHistories = await this.callHistoryService.getCallHistories(
        filter,
        options,
      );

      return callHistories;
    } catch (error) {
      console.log('Error:CallHistoryController:GetCallHistory : ', error);
      throw error;
    }
  }
}
