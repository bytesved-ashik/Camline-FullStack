import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { RolesGuard } from '@classes/role.guard';
import { Roles } from '@decorators/role.decorator';
import { GetQueryDto, PaginateQueryDto } from '@dto/getQuery.dto';
import { REQUEST_STATUS, ROLE, USER_STATUS } from '@enums';
import { IRequest, ISessionRequestDocument } from '@interfaces';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { colonToObject, pick } from '@utils/object.util';
import { Connection, FilterQuery, PaginateOptions } from 'mongoose';

import { AcceptRequestDto } from './dto/accept-request.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { GetRequestDto } from './dto/get-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestService } from './request.service';
import { InjectConnection } from '@nestjs/mongoose';
import { CreateScheduleRequestDto } from './dto/create-schedule-request.dto';
import { NotesRepository } from '@repositories/notes.repository';
import * as moment from 'moment';
import { CreateScheduleRequestByTherapistDto } from './dto/create-schedule-request-by-therapist.dto';

@ApiTags('SessionRequests')
@ApiBearerAuth()
@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly notesRepository: NotesRepository,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.USER)
  @Get()
  @ApiOperation({
    description: 'Get all the queries of a user',
  })
  async getMyRequests(@Req() request: IRequest, @Query() query: GetRequestDto) {
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);
    const filter: FilterQuery<ISessionRequestDocument> = pick(query, [
      'requestType',
      'requestStatus',
    ]);

    filter.user = request.user._id;

    if (query.q) {
      filter.query = {
        $regex: query.q,
        $options: 'i',
      };
    }

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    options.populate = {
      path: 'categories',
    };

    const requests = await this.requestService.getSessionRequests(
      filter,
      options,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get('/get-all-requests')
  @ApiOperation({
    description: 'Get all the queries of a user',
  })
  async getAllRequests(
    @Req() request: IRequest,
    @Query() query: GetRequestDto,
  ) {
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);
    let filter: FilterQuery<ISessionRequestDocument> = pick(query, [
      'requestType',
      'requestStatus',
    ]);

    if (query.q) {
      filter = {
        ...filter,
        $or: [
          { 'user.email': { $regex: query.q, $options: 'i' } },
          { 'user.firstName': { $regex: query.q, $options: 'i' } },
          { 'user.lastName': { $regex: query.q, $options: 'i' } },
        ],
      };
    }

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    const requests = await this.requestService.getFilteredSessionsList(
      filter,
      options,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard)
  @Post('therapist/accept/:requestId')
  @ApiOperation({
    description: 'Accept query from therapist side',
  })
  async acceptRequestByTherapist(
    @Req() req: IRequest,
    @Param('requestId') requestId: string,
    @Body() body: AcceptRequestDto,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request = await this.requestService.acceptTherapistRequest(
        req.user,
        requestId,
        body,
        session,
      );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiOperation({
    description: 'Create a new query for session',
  })
  async createRequest(@Body() body: CreateRequestDto, @Req() req: IRequest) {
    const mongoSession = await this.mongoConnection.startSession();
    mongoSession.startTransaction();
    try {
      const request = await this.requestService.createRequest(
        body,
        req.user._id,
        mongoSession,
      );
      await mongoSession.commitTransaction();
      return request;
    } catch (error) {
      await mongoSession.abortTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    } finally {
      mongoSession.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/reject/:id')
  @ApiOperation({
    description: 'Reject session request by therapist',
  })
  async handleRejectSession(@Req() req: IRequest, @Param('id') id: string) {
    const request = await this.requestService.handleRejectRequest(
      req.user._id.toHexString(),
      id,
    );
    return request;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cancel/:requestId')
  @ApiOperation({
    description: 'Withdraw a request',
  })
  async withdrawRequest(
    @Req() req: IRequest,
    @Param('requestId') requestId: string,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request = await this.requestService.withdrawRequest(
        req.user._id.toHexString(),
        requestId,
        session,
      );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Get('/in-pool')
  @ApiOperation({
    description: 'Get in pool queries matching a therapist',
  })
  async getInPoolRequests(
    @Req() request: IRequest,
    @Query() query: PaginateQueryDto,
  ) {
    if (request.user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(
        `Therapist account status is ${request.user.status}.`,
      );
    }
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    options.populate = [
      {
        path: 'categories',
      },
      {
        path: 'user',
      },
    ];

    const requests = await this.requestService.getInPoolRequests(
      request.user._id,
      options,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST, ROLE.USER)
  @Get('scheduled')
  @ApiOperation({
    description: 'Get scheduled queries matching the therapist',
  })
  async getScheduledRequests(
    @Req() request: IRequest,
    @Query() query: PaginateQueryDto,
  ) {
    const userId = request.user._id;
    const options: PaginateOptions = pick(query, [
      'limit',
      'page',
      'sort',
      'pagination',
    ]);
    const filter: FilterQuery<ISessionRequestDocument> = {
      $or: [{ therapist: userId }, { user: userId }],
      requestStatus: {
        $in: [
          REQUEST_STATUS.SCHEDULED,
          REQUEST_STATUS.OPEN_SCHEDULE,
          REQUEST_STATUS.SCHEDULED_5_MINUTES_REMAINING,
          REQUEST_STATUS.REJECTED,
          REQUEST_STATUS.WITHDRAWN,
        ],
      },
    };

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    options.populate = {
      path: 'categories sessionId user',
    };

    const requests = await this.requestService.getScheduledRequests(
      filter,
      options,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Get('all')
  @ApiOperation({
    description: 'Get all the queries matching the therapist profile',
  })
  async getTherapistRequests(
    @Req() request: IRequest,
    @Query() query: GetQueryDto,
  ) {
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);
    const filter: FilterQuery<ISessionRequestDocument> = {};

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    if (query.q) {
      filter.query = {
        $regex: query.q,
        $options: 'i',
      };
    }

    const requests = await this.requestService.getTherapistRequests(
      request.user,
      filter,
      options,
    );
    return requests;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:requestId')
  @ApiOperation({
    description: 'Get query by id',
  })
  async getRequest(@Param('requestId') requestId: string) {
    const request = await this.requestService.getRequestById(requestId);
    return request;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.USER)
  @Patch('/:requestId')
  @ApiOperation({
    description: 'Update the query',
  })
  async updateRequest(
    @Req() req: IRequest,
    @Param('requestId') requestId: string,
    @Body() body: UpdateRequestDto,
  ) {
    const request = await this.requestService.updateRequest(
      req.user._id.toHexString(),
      requestId,
      body,
    );
    return request;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-schedule')
  @ApiOperation({
    description: 'Create a new query for session',
  })
  async createScheduleRequest(
    @Body() body: CreateScheduleRequestDto,
    @Req() req: IRequest,
  ) {
    const mongoSession = await this.mongoConnection.startSession();
    mongoSession.startTransaction();
    try {
      const request = await this.requestService.createScheduledSessionRequest(
        body,
        req.user._id,
        mongoSession,
      );
      await mongoSession.commitTransaction();
      return request;
    } catch (error) {
      console.log('error : ', error);
      await mongoSession.abortTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    } finally {
      mongoSession.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/withdraw-all-request')
  @ApiOperation({
    description: 'Withdraw all in-pool request',
  })
  async withdrawAllSessionRequest(@Req() req: IRequest) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request = await this.requestService.withdrawAllSessionRequest(
        req.user._id.toHexString(),
      );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Post('therapist/accept/scheduled/:requestId')
  @ApiOperation({
    description: 'Accept query from therapist side',
  })
  async acceptScheduledRequestByTherapist(
    @Req() req: IRequest,
    @Param('requestId') requestId: string,
    @Body() body: AcceptRequestDto,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request =
        await this.requestService.acceptScheduledRequestByTherapist(
          req.user,
          requestId,
          body,
          session,
        );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Post('therapist/reject/scheduled/:requestId')
  @ApiOperation({
    description: 'Reject query from therapist side',
  })
  async rejectScheduledRequestByTherapist(
    @Req() req: IRequest,
    @Param('requestId') requestId: string,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request =
        await this.requestService.rejectScheduledRequestByTherapist(
          req.user,
          requestId,
          session,
        );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Post('/job/test/:requestId')
  @ApiOperation({
    description: 'Job test',
  })
  async jobTest(@Req() req: IRequest, @Param('requestId') requestId: string) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request = await this.requestService.jobTest(
        req.user,
        requestId,
        session,
      );
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard)
  @Post('/therapist-create-schedule')
  @ApiOperation({
    description: 'Create a new query for session by therapist',
  })
  async createScheduleRequestByTherapist(
    @Body() body: CreateScheduleRequestByTherapistDto,
    @Req() req: IRequest,
  ) {
    const mongoSession = await this.mongoConnection.startSession();
    mongoSession.startTransaction();
    try {
      const request =
        await this.requestService.createScheduledSessionRequestByTherapist(
          body,
          req.user._id,
          mongoSession,
        );
      await mongoSession.commitTransaction();
      return request;
    } catch (error) {
      console.log('error : ', error);
      await mongoSession.abortTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    } finally {
      mongoSession.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Post('/update/scheduled/request-type')
  @ApiOperation({
    description: 'Job test',
  })
  async updateScheduledRequestType(@Req() req: IRequest) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const request = await this.requestService.updateScheduledRequestType();
      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
