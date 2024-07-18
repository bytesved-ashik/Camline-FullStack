import {
  Controller,
  Get,
  Post,
  Req,
  Query,
  UseGuards,
  Body,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSessionDto } from './dto/create-session.dto';
import { IRequest, ISessionDocument } from '@interfaces';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { ScheduleSessionDto } from './dto/schedule-session.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Connection,
  FilterQuery,
  PaginateOptions,
  PopulateOptions,
} from 'mongoose';
import { colonToObject, pick } from '@utils/object.util';
import { GetSessionDto } from './dto/get-session.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { ROLE, SESSION_TYPE } from 'src/types/enums';
import { AcceptScheduleSessionDto } from './dto/accept-schedule-session.dto';
import * as moment from 'moment';
import {
  executeFFmpegCommand,
  transcribeAudio,
} from '@utils/video-to-audio.service';
import { CreateTranscriptDto } from './dto/create-transcript-dto';
import * as fs from 'fs';
import { StartRecordingDto } from './dto/start-recording.dto';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('session')
export class SessionController {
  constructor(
    private sessionService: SessionService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  // @Cron(CronExpression.EVERY_SECOND)
  // @ApiOperation({
  //   description:
  //     'CRON job execution to check if minute has passed while user join session',
  // })
  // async handleCompletedMinute() {
  //   const session = await this.mongoConnection.startSession();
  //   session.startTransaction();
  //   try {
  //     await this.sessionService.handleMinuteCompleted(session);
  //     await this.sessionService.sendUpcomingSessionNotification();
  //     await session.commitTransaction();
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @ApiOperation({
  //   description:
  //     'Cron expression run every second to check if ping is not received from last 20 seconds',
  // })
  // async handlePingNotReceived() {
  //   const session = await this.mongoConnection.startSession();
  //   session.startTransaction();
  //   try {
  //     await this.sessionService.handlePingNotReceived(session);
  //     await session.commitTransaction();
  //   } catch (error) {
  //     await session.abortTransaction();
  //     console.log(error.message);
  //   } finally {
  //     session.endSession();
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  @ApiOperation({
    description: 'Create a new session',
  })
  async createSession(
    @Req() request: IRequest,
    @Body() session: CreateSessionDto,
  ) {
    const nSession = await this.sessionService.createSession(request, session);
    return nSession;
  }

  @UseGuards(JwtAuthGuard)
  @Post('schedule/:sessionId')
  @ApiOperation({
    description: 'Schedule a session',
  })
  async scheduleSession(
    @Param('sessionId') sessionId: string,
    @Body() sessionDto: ScheduleSessionDto,
  ) {
    const mongoSession = await this.mongoConnection.startSession();
    mongoSession.startTransaction();
    try {
      const session = await this.sessionService.scheduleSession(
        sessionId,
        sessionDto,
        mongoSession,
      );
      await mongoSession.commitTransaction();
      return session;
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('schedule/accept/:sessionId')
  @ApiOperation({
    description: 'Accept a session after scheduling by therapist',
  })
  async acceptScheduledSession(
    @Param('sessionId') sessionId: string,
    @Body() body: AcceptScheduleSessionDto,
  ) {
    const { streamId } = body;
    const session = await this.sessionService.acceptScheduledSession(
      sessionId,
      streamId,
    );
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Post('reject/:sessionId')
  @ApiOperation({
    description: 'Reject a session after scheduling by therapist',
  })
  async rejectSession(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.rejectSession(sessionId);
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Post('join/:sessionId')
  @ApiOperation({
    description: 'Join a session',
  })
  async joinSession(
    @Req() request: IRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.sessionService.joinSession(
      sessionId,
      request.user._id.toHexString(),
    );
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Post('leave/:sessionId')
  @ApiOperation({
    description: 'Leave session',
  })
  async leaveSession(
    @Req() request: IRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const mongoSession = await this.mongoConnection.startSession();
    mongoSession.startTransaction();
    try {
      const session = await this.sessionService.leaveSession(
        sessionId,
        request.user._id.toHexString(),
        mongoSession,
      );
      await mongoSession.commitTransaction();
      return session;
    } catch (error) {
      await mongoSession.abortTransaction();
      console.log('Error into session:leave session: ', error);
      throw new Error(error);
    } finally {
      await mongoSession.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiOperation({
    description: 'Get all sessions',
  })
  async getAllSessions(
    @Req() request: IRequest,
    @Query() query: GetSessionDto,
  ) {
    let isAdmin = false;

    if (request.user.roles.includes(ROLE.ADMIN)) {
      isAdmin = true;
    }

    let { startDate, endDate } = query;

    if (!startDate || !endDate) {
      startDate = new Date('2024-05-03');
      endDate = new Date();
    }

    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);

    let filter: FilterQuery<ISessionDocument> = pick(query, [
      'sessionType',
      'sessionStatus',
    ]);

    filter.tid = { $ne: null };

    if (!filter.sessionType) {
      filter.sessionType = {
        $ne: SESSION_TYPE.CHAT_SESSION,
      };
    }

    if (!isAdmin) {
      filter['$or'] = [
        { therapist: request.user._id },
        { 'attendees.user': request.user._id },
      ];
    }

    if (query.q) {
      filter.query = {
        $regex: query.q,
        $options: 'i',
      };
    }

    options.populate = [
      {
        path: 'therapist',
        select: '_id firstName lastName',
      },
      {
        path: 'attendees.user',
        select: '_id firstName lastName',
      },
      {
        path: 'tid',
        model: 'Transaction',
        localField: 'tid',
        foreignField: 'tid',
      },
    ];

    if (startDate && endDate) {
      filter = {
        ...filter,
        createdAt: {
          $gte: moment(startDate).startOf('day').toDate(),
          $lte: moment(endDate).endOf('day').toDate(),
        },
      };
    }

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    const sessions = await this.sessionService.getAllSessions(filter, options);
    return sessions;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:sessionId')
  @ApiOperation({
    description: 'Get session by id',
  })
  async getSessionById(
    @Req() request: IRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const populate: PopulateOptions[] = [
      {
        path: 'therapist',
        select: '_id firstName lastName',
      },
      {
        path: 'attendees.user',
        select: '_id firstName lastName',
      },
    ];
    const session = await this.sessionService.getSessionById(
      sessionId,
      populate,
    );
    const currentUser = request.user;

    if (currentUser.role === ROLE.THERAPIST) {
      if (
        session.therapist._id.toHexString() !== currentUser._id.toHexString()
      ) {
        throw new ForbiddenException('You are not authorized');
      }
    } else {
      const attendee = session.attendees.find(
        (attendee) =>
          attendee.user._id.toHexString() === currentUser._id.toHexString(),
      );
      if (!attendee) {
        throw new ForbiddenException('You are not authorized');
      }
    }

    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/rise-hand/:sessionId')
  @ApiOperation({
    description: 'Get session by id',
  })
  async riseHand(
    @Req() request: IRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.sessionService.riseHandApi(
      sessionId,
      request.user._id,
    );
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/video-to-audio')
  @ApiOperation({
    description: 'video to audio convert for transcript',
  })
  async videoToAudio(@Body() dto: CreateTranscriptDto) {
    try {
      const { streamId } = dto;
      const inputFilePath = `https://streaming.24hrtherapy.co.uk/LiveApp/streams/${streamId}.mp4`;
      const outputDir = './storage/wav';
      const outputFilePath = `./storage/wav/${streamId}.wav`;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const output = await executeFFmpegCommand(inputFilePath, outputFilePath);

      return { output };
    } catch (error) {
      console.log('Error : ', error);
      throw new Error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/getTranscript')
  @ApiOperation({
    description: 'getTranscriptr transcript',
  })
  async getTranscript(@Body() dto: CreateTranscriptDto) {
    try {
      const { streamId } = dto;
      const inputFilePath = `./storage/wav/${streamId}.wav`;

      const transcript = await transcribeAudio(inputFilePath);

      const session = await this.sessionService.storeTranscriptInDB(
        streamId,
        transcript,
      );

      return session;
    } catch (error) {
      console.log('Error into getTranscript: ', error);
      throw new Error(
        'Please generate audio file before convert it to transcript.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/startRecording')
  @ApiOperation({
    description: 'startRecording',
  })
  async startRecording(@Body() dto: StartRecordingDto) {
    try {
      const session = await this.sessionService.startRecording(
        dto.streamId,
        dto.url,
      );

      return session;
    } catch (error) {
      console.log('Error into start recording: ', error);
      throw new Error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/stopRecording')
  @ApiOperation({
    description: 'stopRecording',
  })
  async stopRecording(@Body() dto: CreateTranscriptDto) {
    try {
      const session = await this.sessionService.stopRecording(dto.streamId);

      return session;
    } catch (error) {
      console.log('Error into stop recording: ', error);
      throw new Error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-connected')
  @ApiOperation({
    description: 'Get all connected history',
  })
  async getConnectedSessions(
    @Req() request: IRequest,
    @Query() query: GetSessionDto,
  ) {
    try {
      let isAdmin = false;

      if (request.user.roles.includes(ROLE.ADMIN)) {
        isAdmin = true;
      }

      let { startDate, endDate } = query;

      if (!startDate || !endDate) {
        startDate = new Date('2024-05-03');
        endDate = new Date();
      }
      const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);

      let filter: FilterQuery<ISessionDocument> = pick(query, [
        'sessionType',
        'sessionStatus',
      ]);

      filter.tid = { $ne: null };

      if (!filter.sessionType) {
        filter.sessionType = {
          $ne: SESSION_TYPE.CHAT_SESSION,
        };
      }

      if (!isAdmin) {
        filter['$or'] = [
          { therapist: request.user._id },
          { 'attendees.user': request.user._id },
        ];
      }

      if (query.q) {
        filter.query = {
          $regex: query.q,
          $options: 'i',
        };
      }

      options.populate = [
        {
          path: 'therapist',
          select: '_id firstName lastName',
        },
        {
          path: 'attendees.user',
          select: '_id firstName lastName',
        },
        {
          path: 'tid',
          model: 'Transaction',
          localField: 'tid',
          foreignField: 'tid',
        },
      ];

      if (startDate && endDate) {
        filter = {
          ...filter,
          createdAt: {
            $gte: moment(startDate).startOf('day').toDate(),
            $lte: moment(endDate).endOf('day').toDate(),
          },
        };
      }

      if (options.sort) {
        options.sort = colonToObject(options.sort as (typeof query)['sort']);
      }

      const sessions = await this.sessionService.getConnectedSessions(
        filter,
        options,
      );

      return sessions;
    } catch (error) {
      console.log(
        'Error into : sessionController:getConnectedSessions: ',
        error,
      );
      throw new Error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/endSession123/:userId')
  @ApiOperation({
    description: 'stopRecording',
  })
  async endSession123(@Param('userId') userId: string) {
    try {
      const session = await this.sessionService.endSession123(userId);

      return session;
    } catch (error) {
      console.log('Error into stop recording: ', error);
      throw new Error(error);
    }
  }

  @Get('/getPendingSession/:userId')
  @ApiOperation({
    description: 'getPendingSession',
  })
  async getPendingSession(@Param('userId') userId: string) {
    try {
      const session = await this.sessionService.getPendingSession(userId);

      return session;
    } catch (error) {
      console.log('Error into getPendingSession: ', error);
      throw new Error(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/show-transcript/:sessionId')
  @ApiOperation({
    description: 'show transcript by session id',
  })
  async showTranscript(@Param('sessionId') sessionId: string) {
    const transcript = await this.sessionService.showTranscript(sessionId);

    return transcript;
  }
}
