import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from '@entities/session.entity';
import {
  INotesModel,
  ISessionDocument,
  ISessionModel,
  ISessionRequestDocument,
  ISessionRequestModel,
  IUserDocument,
} from '@interfaces';
import { REQUEST_STATUS, SESSION_TYPE } from '@enums';
import { CreateSessionDto } from '@modules/session/dto/create-session.dto';
import { ATTENDEE_TYPE } from '@enums';
import {
  ClientSession,
  FilterQuery,
  PaginateOptions,
  PopulateOptions,
  Types,
  isObjectIdOrHexString,
} from 'mongoose';
import { AcceptRequestDto } from '@modules/sessionRequest/dto/accept-request.dto';
import { SESSION_STATUS } from '@enums';
import { ScheduleSessionDto } from '@modules/session/dto/schedule-session.dto';
import { WalletRepository } from './wallet.repository';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { NOTIFICATION_TYPE } from '@enums';
import { ROLE } from '@enums';
import { PingDto } from '@modules/socket/dto/ping.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@events';
import { UserService } from '@modules/user/user.service';

import * as moment from 'moment';
import { ScheduleSessionNewDto } from '@modules/session/dto/schedule-seesion-new.dto';
import { SessionRequest } from '@entities/request.entity';
import { SystemConfigRepository } from './systemConfig.repository';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { IV, KEY } from '@modules/notes/notes.constant';
import { Notes } from '@entities/notes.entity';
import { createCipheriv, createDecipheriv } from 'crypto';
import {
  executeFFmpegCommand,
  transcribeAudio,
} from '@utils/video-to-audio.service';
import * as fs from 'fs';

@Injectable()
export class SessionRepository {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly socketGateway: SocketGateway,
    private eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    @InjectModel(Session.name) private readonly sessionModel: ISessionModel,
    @InjectModel(SessionRequest.name)
    private readonly requestModel: ISessionRequestModel,
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly http: HttpService,
    @InjectModel(Notes.name) private readonly notesModel: INotesModel,
  ) {}

  async createSession(userId: string, session: CreateSessionDto) {
    const nSession = {
      ...session,
      sessionEndTime: moment(new Date(session.sessionStartTime)).add(
        session.duration,
        'minute',
      ),
      attendees:
        session.sessionType === SESSION_TYPE.PRIVATE
          ? [{ user: new Types.ObjectId(userId) }]
          : [],
    };
    return await this.sessionModel.create(nSession);
  }

  async getAllSessions(
    filter: FilterQuery<ISessionDocument>,
    options?: PaginateOptions,
  ) {
    const sessions = await this.sessionModel.paginate(filter, options);

    const responseDocs = [];

    for (let i = 0; i < sessions.docs.length; i++) {
      let obj: any = sessions.docs[i];
      // const notes = await this.getSessionNotes(obj._id.toHexString());

      const therapist = await this.userService.getTherapistDetails(
        obj.therapist._id,
      );

      const users = [];

      if (obj && obj.attendees && obj.attendees.length > 0) {
        for (let j = 0; j < obj.attendees.length; j++) {
          const userId = obj.attendees[j].user;
          const userDetails = await this.userService.getUserDetails(userId);
          await users.push(userDetails);
        }
      }

      obj = {
        ...obj.toObject(),
        // notes: notes,
        therapist: therapist[0],
        users,
      };

      responseDocs.push(obj);
    }

    return {
      ...sessions,
      docs: responseDocs,
    };
  }

  async scheduleSession(
    sessionId: string,
    dto: ScheduleSessionDto,
    mongoSession: ClientSession,
  ) {
    const session = await this.getSessionById(sessionId);
    // TODO: change accordingly
    const perHourPrice = 40;
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Get the user whom schedule is requested
    const user = session.attendees[0].user.toHexString();
    const transaction = await this.walletRepository.holdBalanceForRequest(
      user,
      perHourPrice / 60,
      mongoSession,
    );

    const scheduledSession = new this.sessionModel({
      therapist: session.therapist,
      //FIXME: change accordingly
      request: session.request,
      sessionStatus: SESSION_STATUS.PENDING,
      sessionType: SESSION_TYPE.PRIVATE,
      attendees: session.attendees.map((att) => {
        return { ...att, isJoined: false };
      }),
      duration: dto.duration,
      streamId: session.streamId,
      sessionPrice: (perHourPrice / 60) * dto.duration,
      sessionStartTime: dto.sessionStartTime,
      sessionEndTime: moment(dto.sessionStartTime).add(dto.duration, 'minutes'),
      joinedAttendees: [],
      tid: transaction.tid,
    });

    this.eventEmitter.emit(
      events.REQUEST_STATUS_UPDATED,
      session.request.toHexString(),
      {
        requestStatus: REQUEST_STATUS.SCHEDULED,
        sessionId: scheduledSession._id,
      },
    );

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_SCHEDULED,
      [user],
      scheduledSession,
    );

    return await scheduledSession.save({ session: mongoSession });
  }

  async scheduleSessionNew(
    dto: ScheduleSessionNewDto,
    mongoSession: ClientSession,
  ) {
    const scheduledSession = new this.sessionModel({
      user: dto.user,
      therapist: dto.therapist,
      request: dto.request,
      sessionStatus: SESSION_STATUS.PENDING,
      sessionType: SESSION_TYPE.PRIVATE,
      attendees:
        dto.sessionType === SESSION_TYPE.PRIVATE ? [{ user: dto.user }] : [],
      duration: 0,
      sessionPrice: dto.sessionPrice,
      sessionStartTime: dto.sessionStartTime,
      sessionEndTime: moment(dto.sessionStartTime).add(dto.duration, 'minutes'),
      joinedAttendees: [],
      tid: dto.tid,
    });
    return await scheduledSession.save({ session: mongoSession });
  }

  async emitREQUEST_STATUS_UPDATED(
    requestId: string,
    userId: string,
    scheduledSession: ISessionDocument,
  ) {
    this.eventEmitter.emit(
      events.REQUEST_STATUS_UPDATED,
      // dto.request.toHexString(),
      requestId,
      {
        requestStatus: REQUEST_STATUS.SCHEDULED,
        sessionId: scheduledSession._id,
      },
    );

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_SCHEDULED,
      // [dto.user.toHexString()],
      [userId],
      scheduledSession,
    );
  }

  async rejectSession(sessionId: string) {
    const session = await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: { sessionStatus: SESSION_STATUS.REJECTED },
    });
    if (session.sessionType === SESSION_TYPE.REQUEST) {
      this.eventEmitter.emit(events.REQUEST_STATUS_UPDATED, session.request, {
        requestStatus: REQUEST_STATUS.IN_POOL,
      });
    }
    this.socketGateway.sendMessageToActiveUsers(
      session.sessionType === SESSION_TYPE.REQUEST
        ? NOTIFICATION_TYPE.REQUEST_REJECTED
        : NOTIFICATION_TYPE.SESSION_REJECTED,
      session.therapist.toHexString().split(' '),
      session,
    );
  }

  // async handlePingNotReceived(mongoSession: ClientSession) {
  //   const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
  //   const sessions = await this.sessionModel
  //     .find({
  //       sessionStatus: { $ne: SESSION_STATUS.ENDED },
  //       'joinedAttendees.pingedAt': { $lte: twentySecondsAgo },
  //     })
  //     .populate('joinedAttendees.user');

  //   for (const session of sessions) {
  //     const notRespondingAttendees = session.joinedAttendees.filter(
  //       (att) => new Date(att.pingedAt).getTime() <= twentySecondsAgo.getTime(),
  //     );

  //     const remainingAttendees = session.joinedAttendees
  //       .filter(
  //         (att) =>
  //           new Date(att.pingedAt).getTime() > twentySecondsAgo.getTime(),
  //       )
  //       .map((att) => att.user._id.toHexString());

  //     for (let attendee of notRespondingAttendees) {
  //       try {
  //         attendee = (attendee as any).toJSON();
  //       } catch (e) {
  //         console.log(e);
  //       }

  //       const joinedAttendees = session.joinedAttendees.filter(
  //         (att) =>
  //           att.user._id.toHexString() !== attendee.user._id.toHexString(),
  //       );

  //       joinedAttendees.push({
  //         ...attendee,
  //         isJoined: false,
  //       });

  //       session.joinedAttendees = joinedAttendees;
  //       await session.save();

  //       this.socketGateway.sendMessageToActiveUsers(
  //         NOTIFICATION_TYPE.USER_NOT_RESPONDING,
  //         remainingAttendees,
  //         { ...attendee, session: session._id.toHexString() },
  //       );
  //     }

  //     if (notRespondingAttendees.length === session.joinedAttendees.length) {
  //       const actorId = notRespondingAttendees[0].user._id.toHexString();
  //       const leftSession = await this.leaveSession(
  //         session._id,
  //         //FIXME: add it as system ended it
  //         actorId,
  //         mongoSession,
  //       );

  //       const leftAttendee = leftSession.joinedAttendees.find(
  //         (attendee) => attendee.user.toHexString() === actorId,
  //       );
  //       //FIXME: this is because ended doesn't get send to actor
  //       this.socketGateway.sendMessageToActiveUsers(
  //         NOTIFICATION_TYPE.SESSION_ENDED,
  //         [actorId],
  //         {
  //           ...session.toJSON(),
  //           leftAttendee,
  //         },
  //       );
  //     }
  //   }
  // }

  async getActiveSessions(user: Types.ObjectId) {
    const sessions = await this.sessionModel.find({
      $or: [
        {
          $and: [
            { sessionType: SESSION_TYPE.REQUEST },
            { 'attendees.user': user },
            {
              sessionStatus: {
                $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.IN_SESSION],
                // old condition
                // $nin: [
                //   SESSION_STATUS.ENDED,
                //   SESSION_STATUS.REJECTED,
                //   // for session scheduled
                //   SESSION_STATUS.PENDING,
                // ],
              },
            },
          ],
        },
        // { 'joinedAttendees.user': user },
      ],
    });
    return sessions;
  }

  async leaveSession(
    sessionId: string,
    userId: string,
    mongoSession: ClientSession,
  ) {
    const session = await this.getSessionById(sessionId);

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const leftAttendee = session.joinedAttendees.find(
      (attendee) => attendee.user.toHexString() === userId,
    );

    const user = session.joinedAttendees.find(
      (joined) => joined.joinedAs === ROLE.USER,
    );

    const stillInSessionAttendees = session.joinedAttendees.filter(
      (attendee) => attendee.user.toHexString() !== userId,
    );

    session.joinedAttendees = stillInSessionAttendees;

    const ids = stillInSessionAttendees.map((attendee) =>
      attendee.user.toHexString(),
    );

    console.log('user : ', user);

    let requestUpdateData: any = {
      requestStatus: REQUEST_STATUS.ENDED,
    };

    //DOUBT: what if user is not found
    if (user) {
      const transaction = await this.walletRepository.commitTransaction(
        user.user.toHexString(),
        session,
        mongoSession,
      );

      console.log('commitTransaction : ', transaction);

      session.sessionPrice = transaction.amount;
      session.tid = transaction.tid;

      requestUpdateData = {
        ...requestUpdateData,
        tid: transaction.tid,
      };
    }

    //FIXME: for group session
    session.sessionStatus = SESSION_STATUS.ENDED;
    // this.eventEmitter.emit(
    //   events.REQUEST_STATUS_UPDATED,
    //   session.request.toHexString(),
    //   {
    //     requestStatus: REQUEST_STATUS.ENDED,
    //   },
    // );

    // update request data
    await this.requestModel.findOneAndUpdate(
      {
        _id: session.request.toHexString(),
      },
      requestUpdateData,
      { new: true, session: mongoSession },
    );

    // stop recording and generate transcript
    await this.stopRecording(sessionId);
    // session.transcript = transcript;

    await session.save({ session: mongoSession });

    console.log('End session event ids : ', ids);

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_ENDED,
      ids,
      {
        ...session.toJSON(),
        leftAttendee,
      },
    );

    return session;
  }

  async acceptRequestSession(
    sessionId: string,
    user: IUserDocument,
    mongoSession: ClientSession,
  ) {
    const session = await this.getSessionById(sessionId);
    const therapist = session.joinedAttendees.find(
      (attendee) => attendee.joinedAs === ROLE.THERAPIST,
    );
    if (!therapist) {
      throw new BadRequestException(
        "Cannot join session as therapist hasn't been joined",
      );
    }
    session.joinedAttendees.push({
      user: user._id,
      joinedAs: ROLE.USER,
      joinedAt: new Date(),
      pingedAt: new Date(),
      isJoined: true,
    });
    session.sessionStatus = SESSION_STATUS.ACCEPTED;
    await session.save({ session: mongoSession });
    return session;
  }

  async updateSessionFee(transaction: string, fee: number) {
    const session = await this.sessionModel.findOneAndUpdate(
      { tid: transaction },
      { $set: { sessionPrice: fee } },
    );
    return session;
  }

  // async handleMinuteCompleted(mongoSession: ClientSession) {
  //   const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  //   const sessions = await this.sessionModel.find({
  //     $and: [
  //       {
  //         sessionStatus: SESSION_STATUS.IN_SESSION,
  //         'joinedAttendees.joinedAs': 'user',
  //       },
  //     ],
  //   });

  //   const filteredSessions = [];

  //   for (const session of sessions) {
  //     const attendees = session.joinedAttendees.filter((attendee) => {
  //       const joinedAt = new Date(attendee.joinedAt).getTime();
  //       const time = Math.abs(
  //         Math.floor((joinedAt - oneMinuteAgo.getTime()) / 1000),
  //       );
  //       return (
  //         attendee.joinedAs === ROLE.USER &&
  //         time % 60 === 0 &&
  //         attendee.isJoined
  //       );
  //     });

  //     if (attendees.length > 0) {
  //       await Promise.all(
  //         attendees.map(async (attendee) => {
  //           await this.holdBalanceByMinute(
  //             attendee.user.toHexString(),
  //             session.tid,
  //             session._id.toHexString(),
  //             mongoSession,
  //           );
  //         }),
  //       );
  //     }
  //   }

  //   return filteredSessions;
  // }

  // async holdBalanceByMinute(
  //   userId: string,
  //   tid: string,
  //   sessionId: string,
  //   mongoSession: ClientSession,
  // ) {
  //   const transaction = await this.walletRepository.getTransaction(tid);
  //   const wallet = await this.walletRepository.getWalletBalance(userId);
  //   const hasFreeBalance = await wallet.hasFreeMinutes();

  //   const CALL_CHARGE_PER_MINUTE =
  //     await this.systemConfigRepository.getCallChargePerMinute();

  //   if (hasFreeBalance) {
  //     const updated = await wallet.holdTrialMinute(mongoSession);
  //     transaction.holdedTrialMinutes += 1;
  //     if (updated.freeTrialMinutes < CALL_CHARGE_PER_MINUTE) {
  //       await this.socketGateway.sendMessageToActiveUsers(
  //         NOTIFICATION_TYPE.TRIAL_ENDED,
  //         transaction.user.toHexString().split(' '),
  //         'Trial session ended ',
  //       );
  //     }
  //     await transaction.save({ session: mongoSession });
  //     return transaction;
  //   }
  //   const hourlyRate = CALL_CHARGE_PER_MINUTE * 60;
  //   const holdBalance = Number((hourlyRate / 60).toFixed(2));
  //   const hasTwoMinutesBalance = await wallet.hasEnoughBalance(
  //     holdBalance * CALL_CHARGE_PER_MINUTE,
  //   );
  //   const hasEnoughBalance = await wallet.hasEnoughBalance(holdBalance);

  //   if (!hasTwoMinutesBalance) {
  //     await this.socketGateway.sendMessageToActiveUsers(
  //       NOTIFICATION_TYPE.INSUFFICIENT_BALANCE,
  //       transaction.user.toHexString().split(' '),
  //       'Insufficient balance',
  //     );
  //   }

  //   if (!hasEnoughBalance) {
  //     return await this.leaveSession(
  //       sessionId,
  //       transaction.user.toHexString(),
  //       mongoSession,
  //     );
  //   }

  //   let holdedFromMain = 0;
  //   let holdedFromBonus = 0;

  //   if (wallet.bonusBalance > holdBalance) {
  //     transaction.holdedBonusBalance += holdBalance;
  //     transaction.amount += holdBalance;
  //     holdedFromBonus = holdBalance;
  //   } else {
  //     holdedFromBonus = wallet.bonusBalance;
  //     holdedFromMain = holdBalance - holdedFromBonus;
  //     transaction.holdedBonusBalance += holdedFromBonus;
  //     transaction.holdedMainBalance += holdedFromMain;
  //     transaction.amount += holdedFromBonus + holdedFromMain;
  //   }
  //   await transaction.save({ session: mongoSession });
  //   await wallet.holdBalance(holdedFromMain, holdedFromBonus, mongoSession);
  // }

  async createSessionFromRequest(
    request: ISessionRequestDocument,
    acceptedBy: IUserDocument,
    acceptDto: AcceptRequestDto,
    clientSession: ClientSession,
  ) {
    const session = new this.sessionModel({
      therapist: acceptedBy._id,
      request: request._id,
      isTherapistJoined: false,
      tid: request.tid,
      streamId: acceptDto.streamId,
      sessionStatus: SESSION_STATUS.PENDING,
      attendees: [{ user: request.user, isJoined: false }],
      joinedAttendees: [],
    });
    return await session.save({ session: clientSession });
  }

  async getSessionById(
    sessionId: string,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<ISessionDocument> {
    return this.sessionModel.findById(sessionId).populate(populate);
  }

  async joinSession(sessionId: string, userId: string) {
    console.log('joinSession api called userId is : ', userId);
    const session = await this.getSessionById(sessionId);

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.sessionStatus === SESSION_STATUS.ENDED) {
      throw new BadRequestException('Session is already ended');
    }

    const user = session.attendees.find(
      (att) => att.user.toHexString() === userId,
    );

    const joinedUser = session.joinedAttendees.find(
      (att) => att.user.toHexString() === userId,
    );

    const therapist = session.therapist.toHexString();

    if (!user && therapist !== userId) {
      throw new UnauthorizedException(
        'You are not allowed to join this session',
      );
    }

    if (
      (therapist === userId && session.isTherapistJoined && !joinedUser) ||
      (user?.isJoined && !joinedUser)
    ) {
      throw new BadRequestException('Session is already ended');
    }

    if (
      session.sessionType === SESSION_TYPE.REQUEST &&
      session.therapist.toHexString() !== userId &&
      session.joinedAttendees.findIndex(
        (attendee) => attendee.joinedAs === ROLE.THERAPIST,
      ) === -1
    ) {
      throw new BadRequestException(
        "Cannot join session as therapist hasn't been joined",
      );
    }

    if (session.sessionType === SESSION_TYPE.REQUEST && therapist !== userId) {
      this.eventEmitter.emit(
        events.REQUEST_STATUS_UPDATED,
        session.request.toHexString(),
        { requestStatus: REQUEST_STATUS.IN_SESSION },
      );
    }

    session.sessionStatus = SESSION_STATUS.IN_SESSION;
    const joiningUser = {
      user: new Types.ObjectId(userId),
      joinedAs:
        session.therapist.toHexString() === userId
          ? ATTENDEE_TYPE.THERAPIST
          : ATTENDEE_TYPE.USER,
      joinedAt: new Date(),
      pingedAt: new Date(),
      isJoined: true,
    };

    if (
      session.joinedAttendees.findIndex(
        (att) => att.user.toHexString() === userId,
      ) === -1
    ) {
      session.joinedAttendees.push(joiningUser);
    }

    await this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.USER_JOINED,
      [therapist, ...session.attendees.map((att) => att.user.toHexString())],
      {
        ...joiningUser,
        user: await this.userService.getUserById(userId),
      },
    );

    let isTherapistJoined = true;
    let emailUserId = therapist;

    if (therapist !== userId) {
      emailUserId = userId;
      isTherapistJoined = false;

      user.isJoined = true;
      session.attendees[
        session.attendees.findIndex((att) => att.user.toHexString() === userId)
      ] = user;
    } else {
      session.isTherapistJoined = true;
    }

    if (isTherapistJoined) {
    }
    return await this.sessionModel.findByIdAndUpdate(sessionId, session);
  }

  async rejectRequestSession(sessionId: string, mongoSession: ClientSession) {
    const session = await this.getSessionById(sessionId);
    session.sessionStatus = SESSION_STATUS.REJECTED;
    session.joinedAttendees = [];
    await session.save({ session: mongoSession });
    return session;
  }

  async updatePing(payload: PingDto, userId: string) {
    // console.log('ping received : userid is: ', userId);
    if (!isObjectIdOrHexString(payload.session)) {
      return new BadRequestException('Given string is not a valid id');
    }

    const session = await this.getSessionById(payload.session);

    const attendees = session.joinedAttendees.map((att) => {
      if (att.user.toHexString() === userId) {
        att.pingedAt = new Date();
      }
      return att;
    });

    //FIXME: there are no joinedAttendees
    const currentAttendee = session.joinedAttendees.find(
      (att) => att.user.toHexString() === userId,
    );

    if (!currentAttendee) {
      return;
    }

    if (currentAttendee.joinedAs === ROLE.THERAPIST) {
      session.duration += 5;

      console.log('Session duration : ', session.duration);

      if (session && session.request) {
        const request = await this.requestModel.findOne({
          _id: session.request,
        });

        if (request && request.user) {
          const requestUserId = request.user._id.toHexString();
          const therapistId = session.therapist.toHexString();

          let callMinutes = Number(session.duration / 60);
          // add extra minutes because of we have to call end before 1 minute, so no negative balance
          // callMinutes = callMinutes + 1;
          const { deductAmount, extraCharge, userReferToTherapist } =
            await this.walletRepository.getDeduction(
              requestUserId,
              callMinutes,
              therapistId,
            );

          let totalDeductAmount = deductAmount;

          if (userReferToTherapist) {
            totalDeductAmount = deductAmount + extraCharge;
          }

          const isCallEndDueToLowBalance =
            await this.walletRepository.isCallEndDueToLowBalance(
              requestUserId,
              totalDeductAmount,
            );

          if (isCallEndDueToLowBalance) {
            console.log(
              'USER_INSUFFICIENT_BALANCE for cut call due to low bal : ',
              [
                therapistId,
                ...session.attendees.map((att) => att.user.toHexString()),
              ],
            );

            await this.socketGateway.sendMessageToActiveUsers(
              NOTIFICATION_TYPE.USER_INSUFFICIENT_BALANCE,
              [
                therapistId,
                ...session.attendees.map((att) => att.user.toHexString()),
              ],
              {
                session,
                therapistId,
                userId,
              },
            );
          }
        }
      }
    }

    session.joinedAttendees = attendees;
    await session.save();
  }

  async sendUpcomingNotification() {
    const now = new Date();
    const sessions = await this.sessionModel.find({
      sessionType: SESSION_TYPE.PRIVATE,
      sessionStartTime: {
        $gt: now,
      },
    });

    const timeNotifications = [
      { time: 15, notificationType: NOTIFICATION_TYPE.FIFTEEN_MINUTES_LEFT },
      { time: 5, notificationType: NOTIFICATION_TYPE.FIVE_MINUTES_LEFT },
      { time: 1, notificationType: NOTIFICATION_TYPE.ONE_MINUTES_LEFT },
    ];

    sessions.forEach((session) => {
      const sessionTime = new Date(session.sessionStartTime).setMilliseconds(0);
      timeNotifications.forEach((timeNotification) => {
        const time = new Date(
          now.getTime() + timeNotification.time * 60 * 1000,
        ).setMilliseconds(0);
        if (sessionTime === time) {
          const attendees = session.attendees.map((attendee) =>
            attendee.user.toHexString(),
          );
          this.socketGateway.sendMessageToActiveUsers(
            timeNotification.notificationType,
            [session.therapist.toHexString(), ...attendees],
            session,
          );
        }
      });
    });
  }

  async acceptScheduledSession(sessionId: string, streamId: string) {
    const session = await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: { sessionStatus: SESSION_STATUS.ACCEPTED, streamId: streamId },
    });
    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_ACCEPTED,
      session.therapist.toHexString().split(' '),
      session,
    );
    return session;
  }

  async checkDateConflict(filter, startDate, endDate) {
    // Query to find any overlapping appointment
    let conflictQuery: any = {
      $or: [
        {
          sessionStartTime: { $lt: endDate },
          sessionEndTime: { $gt: startDate },
        },
        {
          sessionStartTime: { $lte: startDate },
          sessionEndTime: { $gte: endDate },
        },
      ],
    };

    conflictQuery = {
      ...conflictQuery,
      filter,
    };

    const conflictingAppointments = await this.sessionModel.findOne(
      conflictQuery,
    );

    return conflictingAppointments;
  }

  async handleRiseHand(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId);
    const therapistId = session.therapist.toHexString();

    const eventRecivers = [
      ...session.attendees.map((att) => {
        if (userId != att.user.toHexString()) {
          return att.user.toHexString();
        }
      }),
    ];

    if (therapistId != userId) {
      eventRecivers.push(therapistId);
    }

    console.log('eventRecivers : ', eventRecivers);

    await this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.RISE_HAND_SUCCESS,
      [
        session.therapist.toHexString(),
        ...session.attendees.map((att) => att.user.toHexString()),
      ],
      {
        sessionId,
        userId,
      },
    );
  }

  async riseHandApi(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId);
    const therapistId = session.therapist.toHexString();

    const eventRecivers = [
      ...session.attendees.map((att) => {
        if (userId != att.user.toHexString()) {
          return att.user.toHexString();
        }
      }),
    ];

    // if (therapistId != userId) {
    eventRecivers.push(therapistId);
    // }

    console.log('eventRecivers : ', eventRecivers);

    await this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.RISE_HAND_SUCCESS,
      eventRecivers,
      {
        sessionId,
        userId,
      },
    );

    return {
      sessionId,
      therapistId,
      eventRecivers,
      userId,
    };
  }

  async createSessionForChat(userId: string, therapistId: string) {
    const attendees = [{ user: userId, isJoined: false }];

    const chatSession = await this.sessionModel.findOne({
      therapist: therapistId,
      attendees: { $all: attendees },
      sessionType: SESSION_TYPE.CHAT_SESSION,
    });

    if (!chatSession) {
      const session = await this.sessionModel.create({
        therapist: therapistId,
        sessionType: SESSION_TYPE.CHAT_SESSION,
        attendees,
        joinedAttendees: [],
      });
      return session;
    } else {
      return chatSession;
    }
  }

  async getInSessionTherapistIds() {
    const sessions = await this.sessionModel
      .find({
        sessionType: SESSION_TYPE.REQUEST,
        sessionStatus: {
          $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.IN_SESSION],
        },
      })
      .select('therapist')
      .exec();

    const ids = sessions.map((session) => session.therapist.toHexString());

    return ids;
  }

  async storeTranscriptInDB(streamId: string, transcript: string) {
    const sessions = await this.sessionModel.findOneAndUpdate(
      { streamId: streamId },
      { transcript: transcript },
      { new: true },
    );

    return sessions;
  }

  async startRecording(streamId: string, url: string) {
    const apiUrl = `https://streaming.24hrtherapy.co.uk/LiveApp/rest/v1/media-push/start?streamId=${streamId}`;

    const { data } = await firstValueFrom(
      this.http.post(apiUrl, { url: url, width: 1280, height: 720 }).pipe(
        catchError((error) => {
          throw `An error happened. Msg: ${JSON.stringify(
            error?.response?.data,
          )}`;
        }),
      ),
    );
    return data;
  }

  async stopRecording(streamId: string) {
    const url = `https://streaming.24hrtherapy.co.uk/LiveApp/rest/v1/media-push/stop/${streamId}`;

    const { data } = await firstValueFrom(
      this.http.post(url, { url: url, width: 1280, height: 720 }).pipe(
        catchError((error) => {
          throw `An error happened. Msg: ${JSON.stringify(
            error?.response?.data,
          )}`;
        }),
      ),
    );

    // const session = await this.getSessionById(streamId);
    // let transcript = '';

    // if (session) {
    //   transcript = session.transcript;

    //   if (transcript == undefined || transcript == '') {
    //     transcript = await this.generateTranscriptAndStoreIntoDB(streamId);
    //   }
    // }

    return data;
  }

  async getConnectedSessions(
    filter: FilterQuery<ISessionDocument>,
    options?: PaginateOptions,
  ) {
    const sessions = await this.sessionModel.paginate(filter, options);

    const responseDocs = [];

    for (let i = 0; i < sessions.docs.length; i++) {
      let obj: any = sessions.docs[i];
      const notes = await this.getSessionNotes(obj._id.toHexString());

      const therapist = await this.userService.getTherapistDetails(
        obj.therapist._id,
      );

      const users = [];

      if (obj && obj.attendees && obj.attendees.length > 0) {
        for (let j = 0; j < obj.attendees.length; j++) {
          const userId = obj.attendees[j].user;
          const userDetails = await this.userService.getUserDetails(userId);
          await users.push(userDetails);
        }
      }

      obj = {
        ...obj.toObject(),
        notes: notes,
        therapist: therapist[0],
        users,
      };

      responseDocs.push(obj);
    }

    return {
      ...sessions,
      docs: responseDocs,
    };
  }

  async getSessionNotes(sessionId: string) {
    const notes = await this.notesModel.find({
      sessionId: sessionId,
    });

    notes.map(async (note) => {
      const decryptNotes = await this.decrypt(note.notes);
      note.notes = decryptNotes;

      return note;
    });

    return notes;
  }

  // Decrypting text
  async decrypt(encryptNotes) {
    const iv = Buffer.from(IV, 'hex');
    const key = Buffer.from(KEY, 'hex');
    const notes = Buffer.from(encryptNotes, 'hex');

    const decipher = createDecipheriv('aes-256-ctr', key, iv);
    const decryptedText = Buffer.concat([
      decipher.update(notes),
      decipher.final(),
    ]);
    return decryptedText.toString();
  }

  async generateTranscriptAndStoreIntoDB(streamId: string) {
    let transcript = '';

    await this.sleep5Seconds();

    console.log('video to audio start');
    // convert audio to video
    await this.videoToAudio(streamId);
    const outputFilePath = `./storage/wav/${streamId}.wav`;
    console.log('video to audio stop');

    while (!fs.existsSync(outputFilePath)) {
      await this.sleep5Seconds();
    }

    console.log('transcript start');
    // generate transcript
    transcript = await transcribeAudio(outputFilePath);
    console.log('transcript stop');

    // const session = await this.sessionModel.findOneAndUpdate(
    //   { _id: streamId },
    //   { transcript: transcript },
    //   { new: true },
    // );

    return transcript;
  }

  async videoToAudio(streamId: string) {
    const inputFilePath = `https://streaming.24hrtherapy.co.uk/LiveApp/streams/${streamId}.mp4`;
    const outputDir = './storage/wav';
    const outputFilePath = `./storage/wav/${streamId}.wav`;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const output = await executeFFmpegCommand(inputFilePath, outputFilePath);

    return output;
  }

  async sleep5Seconds() {
    return new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }

  async endSession123(userId: string) {
    const activeSessionIds = await this.getParticualrUsersActiveSessionIds(
      userId,
    );

    const sessions = await this.sessionModel.updateMany(
      {
        _id: { $in: activeSessionIds },
      },
      {
        sessionStatus: SESSION_STATUS.ENDED,
      },
    );

    return activeSessionIds;
  }

  async getPendingSession(userId: string) {
    const filter: FilterQuery<ISessionDocument> = {};
    filter['$or'] = [{ therapist: userId }, { 'attendees.user': userId }];

    const sessions = await this.getAllSessions(filter, { pagination: false });

    return sessions;
  }

  async sleepSeconds(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async showTranscript(sessionId: string) {
    const session = await this.getSessionById(sessionId);

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    let transcript = session.transcript;

    if (transcript == undefined || transcript == '') {
      console.log('video to audio start');
      // convert audio to video
      await this.videoToAudio(sessionId);
      const outputFilePath = `./storage/wav/${sessionId}.wav`;
      console.log('video to audio stop');

      while (!fs.existsSync(outputFilePath)) {
        await this.sleepSeconds(3000);
      }

      console.log('transcript start');
      // generate transcript
      transcript = await transcribeAudio(outputFilePath);
      console.log('transcript stop');

      await this.sessionModel.findOneAndUpdate(
        { _id: sessionId },
        { transcript: transcript },
        { new: true },
      );
    }

    return transcript;
  }

  async getParticualrUsersActiveSessionIds(userId: string) {
    let filter: FilterQuery<ISessionDocument> = {};
    filter['$or'] = [{ therapist: userId }, { 'attendees.user': userId }];

    filter = {
      ...filter,
      sessionType: SESSION_TYPE.REQUEST,
      sessionStatus: {
        $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.IN_SESSION],
      },
    };

    const sessions = await this.sessionModel.find({
      ...filter,
    });

    const ids = sessions.map((session) => session._id.toHexString());

    return ids;
  }
}
