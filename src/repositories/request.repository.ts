import { InjectModel } from '@nestjs/mongoose';
import { SessionRequest } from '@entities/request.entity';
import {
  ISessionRequestModel,
  IUserDocument,
  ISessionRequestDocument,
} from '@interfaces';
import { CreateRequestDto } from '@modules/sessionRequest/dto/create-request.dto';
import {
  REQUEST_STATUS,
  REQUEST_TYPE,
  ROLE,
  SESSION_TYPE,
  USER_STATUS,
} from '@enums';
import { UpdateRequestDto } from '@modules/sessionRequest/dto/update-request.dto';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { UserRepository } from './user.repository';
import { AcceptRequestDto } from '@modules/sessionRequest/dto/accept-request.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { NOTIFICATION_TYPE } from '@enums';
import { WalletRepository } from './wallet.repository';
import {
  ClientSession,
  FilterQuery,
  PaginateOptions,
  PaginateResult,
  Types,
} from 'mongoose';
import { UpdateRequestSessionDto } from '@modules/sessionRequest/dto/update-request-session.dto';
import { CreateScheduleRequestDto } from '@modules/sessionRequest/dto/create-schedule-request.dto';
import * as moment from 'moment';
import ical from 'ical-generator';
import * as nodemailer from 'nodemailer';
import { NotesRepository } from './notes.repository';
import { REQUEST_TIMES } from '@constants/index';
import { REQUEST_TEXT_COLOR } from 'src/types/enums/request-text-color.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@events';
import { replaceDescWithMinusOne } from '@utils/object.util';
import { AgendaAppService } from '@utils/agenda.service';
import { CreateScheduleRequestByTherapistDto } from '@modules/sessionRequest/dto/create-schedule-request-by-therapist.dto';

export class RequestRepository {
  constructor(
    @InjectModel(SessionRequest.name)
    private readonly requestModel: ISessionRequestModel,
    private readonly socketGateway: SocketGateway,
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly notesRepository: NotesRepository,
    private eventEmitter: EventEmitter2,
    private readonly agendaAppService: AgendaAppService,
  ) {}

  async createSessionRequest(
    dto: CreateRequestDto,
    user: Types.ObjectId,
    session: ClientSession,
  ) {
    const existingRequestInPool = await this.requestModel.findOne({
      user,
      requestStatus: REQUEST_STATUS.IN_POOL,
    });

    if (existingRequestInPool) {
      throw new BadRequestException(
        'You already have a request in pool. Please wait for it to expire or cancel it.',
      );
    }

    const joinedSessions = await this.sessionRepository.getActiveSessions(user);

    if (joinedSessions.length > 0) {
      throw new BadRequestException(
        "Can't create a new query while user is already in session",
      );
    }

    // check weather therapist account is active or not
    if (dto.therapist) {
      const therapistUser = await this.userRepository.getUserById(
        dto.therapist,
      );

      if (therapistUser.status != USER_STATUS.ACTIVE) {
        throw new BadRequestException('Selected therapist is not activated.');
      }
    }

    //  check is user topup and sufficiant balance
    await this.walletRepository.walletCheckForSessionRequest(
      user.toHexString(),
    );
    // TODO: Get hourly rate from therapist profile
    // const hourlyRate = 40;

    // const transaction = await this.walletRepository.holdBalanceForRequest(
    //   user.toHexString(),
    //   Number((hourlyRate / 60).toFixed(2)),
    //   session,
    // );

    const request = new this.requestModel({
      ...dto,
      user,
    });

    await request.save({ session });

    // if (dto.therapist) {
    //   await this.sendMessageToUser(request);
    // } else {
    //   await this.findMatchingTherapists(request);
    // }

    return request;
  }

  async findMatchingTherapists(request: ISessionRequestDocument) {
    const therapistProfiles =
      await this.userRepository.getTherapistProfileByCategory(
        request.categories,
      );

    let ids = therapistProfiles.map((therapistProfile) =>
      therapistProfile.user._id.toHexString(),
    );

    // const offlineTherapists =
    //   await this.userRepository.activeStatusAndOfflineTherapistFromIds(ids);

    // const offlineTherapistsIds = offlineTherapists.map((therapistProfile) =>
    //   therapistProfile._id.toHexString(),
    // );

    const activeStatusTherapist =
      await this.userRepository.activeStatusTherapistFromIds(ids);

    ids = activeStatusTherapist.map((therapistProfile) =>
      therapistProfile._id.toHexString(),
    );

    const smsIds = activeStatusTherapist.map((therapistProfile) =>
      therapistProfile._id.toHexString(),
    );

    const inSessionTherapistIds =
      await this.sessionRepository.getInSessionTherapistIds();

    ids = ids.filter(function (id) {
      return !inSessionTherapistIds.includes(id);
    });

    console.log('phoneNumbers ids : ', smsIds);

    const phoneNumbers = await this.userRepository.getTherapistsPhoneNumbers(
      smsIds,
    );

    console.log('phoneNumbers : ', phoneNumbers);

    this.eventEmitter.emit(events.SMS_SEND, {
      phoneNumbers: phoneNumbers,
    });

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.REQUEST_RECEIVED,
      ids,
      request,
    );
  }

  async getMatchingCategoryTherapistIds(request: ISessionRequestDocument) {
    const therapistProfiles =
      await this.userRepository.getTherapistProfileByCategory(
        request.categories,
      );

    const ids = therapistProfiles.map((therapistProfile) =>
      therapistProfile.user._id.toHexString(),
    );

    return ids;
  }

  async sendMessageToUser(request: ISessionRequestDocument) {
    const therapistProfile = await this.userRepository.getTherapistProfile(
      request.therapist.toHexString(),
    );

    if (therapistProfile && therapistProfile.phoneNumber) {
      const therapistPhoneNumber = therapistProfile.phoneNumber;

      this.eventEmitter.emit(events.SMS_SEND, {
        phoneNumbers: [therapistPhoneNumber],
      });
    }

    this.socketGateway.sendMessageToUser(
      NOTIFICATION_TYPE.REQUEST_RECEIVED,
      therapistProfile.user._id.toHexString(),
      request,
    );
  }

  async handleRejectRequest(user: string, sessionRequestId: string) {
    const request = await this.requestModel.findByIdAndUpdate(
      sessionRequestId,
      {
        $push: {
          rejectedBy: new Types.ObjectId(user),
        },
      },
    );
    return request;
  }

  async getSessionRequests(
    filter: FilterQuery<ISessionRequestDocument>,
    options?: PaginateOptions,
  ): Promise<PaginateResult<ISessionRequestDocument>> {
    return this.requestModel.paginate(filter, options);
  }

  async getInPoolRequests(
    user: IUserDocument,
    status: REQUEST_STATUS,
    options?: PaginateOptions,
  ): Promise<PaginateResult<ISessionRequestDocument>> {
    const profile = await this.userRepository.getTherapistProfile(user._id);

    if (!profile) {
      throw new BadRequestException('Therapist profile not found');
    }
    const requests = await this.requestModel.paginate(
      {
        $or: [
          {
            categories: { $in: profile.categories },
            requestType: REQUEST_TYPE.PRIVATE,
          },
          {
            requestType: REQUEST_TYPE.PRIVATE_SPECIFIC_THERAPIST,
            therapist: user._id,
          },
        ],
        requestStatus: status,
        rejectedBy: { $nin: [user._id] },
      },
      options,
    );

    for (let i = 0; requests.docs.length > i; i++) {
      const requestedAtTime = moment(requests.docs[i].requestedAt);
      const currentTime = moment();

      const minutesDifference = currentTime.diff(requestedAtTime, 'minutes');

      if (minutesDifference <= REQUEST_TIMES.MIN_TIME) {
        requests.docs[i].color = REQUEST_TEXT_COLOR.GREEN;
      } else if (
        minutesDifference >= REQUEST_TIMES.MIN_TIME &&
        minutesDifference <= REQUEST_TIMES.MAX_TIME
      ) {
        requests.docs[i].color = REQUEST_TEXT_COLOR.ORANGE;
      } else if (minutesDifference > REQUEST_TIMES.MAX_TIME) {
        requests.docs[i].color = REQUEST_TEXT_COLOR.RED;
      }
    }

    const getInSessionTherapistIds =
      await this.sessionRepository.getInSessionTherapistIds();

    if (getInSessionTherapistIds.includes(user._id.toHexString())) {
      requests.docs = [];
    }
    return requests;
  }

  async getScheduledRequests(
    filter: FilterQuery<ISessionRequestDocument>,
    options?: PaginateOptions,
  ): Promise<PaginateResult<ISessionRequestDocument>> {
    const requests: any = await this.requestModel.paginate(filter, options);
    const responseDocs = [];

    for (let i = 0; i < requests.docs.length; i++) {
      let obj: any = requests.docs[i];
      const userNotes = await this.notesRepository.getUsersNotes(
        obj.user._id.toHexString(),
      );

      obj = {
        ...obj.toObject(),
        userNotes: userNotes,
      };

      responseDocs.push(obj);
    }

    return {
      ...requests,
      docs: responseDocs,
    };
  }

  async getTherapistRequests(
    filter: FilterQuery<ISessionRequestDocument>,
    options: PaginateOptions,
  ) {
    const requests = await this.requestModel.paginate(filter, options);

    return requests;
  }

  async acceptTherapistRequest(
    user: IUserDocument,
    requestId: string,
    body: AcceptRequestDto,
    clientSession: ClientSession,
  ) {
    const request = await this.getSessionRequest(requestId);

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(
        `You can't accept session request beacuse of your account is not active.`,
      );
    }

    if (request.requestStatus !== REQUEST_STATUS.IN_POOL) {
      throw new BadRequestException(`Request already ${request.requestStatus}`);
    }

    const getInSessionTherapistIds =
      await this.sessionRepository.getInSessionTherapistIds();

    if (getInSessionTherapistIds.includes(user._id.toHexString())) {
      throw new BadRequestException(`You are already in session.`);
    }

    const therapistProfile = await this.userRepository.getTherapistProfile(
      user._id.toHexString(),
    );

    request.acceptedBy.push({
      user: user._id,
      streamId: body.streamId,
      acceptedAt: new Date(),
    });
    request.requestStatus = REQUEST_STATUS.ACCEPTED;

    const session = await this.sessionRepository.createSessionFromRequest(
      request,
      user,
      body,
      clientSession,
    );

    request.sessionId = session._id;

    await this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.REQUEST_ACCEPTED,
      [request.user._id.toHexString()],
      {
        ...session.toObject(),
        acceptedBy: {
          ...user,
          profile: therapistProfile.toJSON(),
        },
      },
    );
    await request.save({ session: clientSession });

    const matchingTherapistIds = await this.getMatchingCategoryTherapistIds(
      request,
    );

    await this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.REQUEST_ACCEPTED_BY_THERAPIST,
      matchingTherapistIds,
      {
        ...session.toObject(),
        acceptedBy: {
          ...user,
          profile: therapistProfile.toJSON(),
        },
      },
    );

    return session;
  }

  async getSessionRequest(id: string) {
    return await this.requestModel.findById(id).populate('categories');
  }

  async updateSessionRequest(
    user: string,
    id: string,
    request: UpdateRequestDto,
  ) {
    const query = await this.getSessionRequest(id);
    if (query.user.toHexString() === user) {
      return await this.requestModel.findByIdAndUpdate(id, {
        $set: { ...request },
      });
    }
    throw new UnauthorizedException('You are not authorize to edit this query');
  }

  async withdrawSessionRequest(
    user: string,
    id: string,
    session: ClientSession,
  ) {
    const request = await this.getSessionRequest(id);
    if (request.user.toHexString() !== user) {
      throw new UnauthorizedException(
        'You are not allowed to cancel this request',
      );
    }
    // await this.walletRepository.releaseHoldings(request.tid, session);
    request.requestStatus = REQUEST_STATUS.WITHDRAWN;
    return await request.save({ session });
  }

  async updateRequestStatus(id: string, payload: UpdateRequestSessionDto) {
    const request = await this.getSessionRequest(id);
    Object.assign(request, payload);
    if (payload.requestStatus === REQUEST_STATUS.IN_POOL) {
      request.requestedAt = new Date();
    }
    return await request.save();
  }

  async deleteSessionRequest(id: string) {
    return await this.requestModel.findByIdAndDelete(id);
  }

  async createScheduledSessionRequest(
    dto: CreateScheduleRequestDto,
    user: Types.ObjectId,
    session: ClientSession,
  ) {
    const { therapistId, startDate, duration } = dto;
    const therapist = await this.userRepository.getUserById(therapistId);
    const userProfile = await this.userRepository.getUserProfile(
      user.toString(),
    );

    const endDate = moment(new Date(startDate)).add(duration, 'minute');
    const startDateDate = moment(new Date(startDate));

    if (!therapist || !therapist.roles.includes(ROLE.THERAPIST)) {
      throw new BadRequestException('Therapist does not exists.');
    }

    // check is user scheduled any appointment on same time or not
    const isUserBusy = await this.checkScheduleDateConflict(
      {
        user: user,
        requestStatus: {
          $in: [REQUEST_STATUS.OPEN_SCHEDULE, REQUEST_STATUS.SCHEDULED],
        },
      },
      startDate,
      endDate,
    );

    if (isUserBusy) {
      throw new BadRequestException('User has already another appointmnet.');
    }

    // check is therapist scheduled any appointment on same time or not
    const isTherapistBusy = await this.checkScheduleDateConflict(
      {
        therapist: therapistId,
        requestStatus: {
          $in: [REQUEST_STATUS.OPEN_SCHEDULE, REQUEST_STATUS.SCHEDULED],
        },
      },
      startDate,
      endDate,
    );

    if (isTherapistBusy) {
      throw new BadRequestException(
        'Therapist has already another appointmnet.',
      );
    }

    const categories = userProfile.categories;
    const query = 'I want to schedule appointment';
    const requestType = REQUEST_TYPE.PRIVATE_SPECIFIC_THERAPIST;
    const requestStatus = REQUEST_STATUS.OPEN_SCHEDULE;

    const request = new this.requestModel({
      categories,
      query,
      requestType,
      requestStatus,
      user,
      therapist: therapistId,
      scheduleSessionDuration: dto.duration,
      scheduleStartDate: startDateDate,
      scheduleEndDate: endDate,
    });

    await request.save({ session });

    return request;
  }

  async sendCalendarInvite(subject: string, startDate: Date, endDate: Date) {
    const event = {
      start: startDate,
      end: endDate,
      summary: subject,
      description: 'Event description',
      location: 'Event location',
    };

    const icsFile = ical({
      name: 'Event Calendar',
      events: [event],
    }).toString();

    const transporter = nodemailer.createTransport({
      // Configure your email transport settings (e.g., SMTP, Gmail, etc.)
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: '0389f7342e7080',
        pass: '83b31e45ec1abb',
      },
    });

    const mailOptions = {
      from: '0389f7342e7080',
      to: 'v.naresh.6554@gmail.com',
      subject: 'subject',
      text: icsFile,
      attachments: [
        {
          content: Buffer.from(icsFile).toString('base64'),
          encoding: 'base64',
          filename: 'event.ics',
        },
      ],
    };
    await transporter.sendMail(mailOptions);
  }

  async withdrawAllSessionRequest(user: string) {
    const allRequests = this.requestModel.updateMany(
      {
        user,
        requestStatus: REQUEST_STATUS.IN_POOL,
      },
      {
        requestStatus: REQUEST_STATUS.WITHDRAWN,
      },
    );

    return allRequests;
  }

  async getFilteredSessionsList(
    filter: FilterQuery<ISessionRequestDocument>,
    options: PaginateOptions,
  ) {
    const pipelines: any = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'user._id',
          foreignField: 'user',
          as: 'userprofile',
        },
      },
      {
        $unwind: {
          path: '$userprofile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'media',
          localField: 'userprofile.profilePicture',
          foreignField: '_id',
          as: 'profilePicture',
        },
      },
      {
        $unwind: {
          path: '$profilePicture',
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $lookup: {
      //     from: 'media',
      //     localField: 'medias.mediaId',
      //     foreignField: '_id',
      //     as: 'medias',
      //   },
      // },
      // {
      //   $unwind: {
      //     path: '$medias.mediaId',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
    ];

    if (filter) {
      pipelines.push({
        $match: {
          $and: [filter],
        },
      });
    }

    if (filter) {
      pipelines.push({
        $match: {
          $and: [filter],
        },
      });
    }

    if (options && options.sort) {
      const modifiedOptions = await replaceDescWithMinusOne(options.sort);

      pipelines.push({
        $sort: modifiedOptions,
      });
    }

    const totalDocsPipeline = [...pipelines];
    totalDocsPipeline.push({ $count: 'user' });
    const docsLength = await this.requestModel.aggregate(totalDocsPipeline);

    let totalDocs = 0;
    if (docsLength.length > 0) {
      totalDocs = docsLength[0].user;
    }

    let skip = 0;
    if (options.page && options.limit) {
      skip = (options.page - 1) * options.limit;
    }

    pipelines.push({ $skip: skip });

    if (options.limit) {
      pipelines.push({ $limit: options.limit });
    }

    const sessions = await this.requestModel.aggregate(pipelines);

    const paginateData = await this.getPaginateDataFormTotalDocs(
      totalDocs,
      options.page,
      options.limit,
    );

    const responseData = {
      docs: sessions,
      ...paginateData,
    };

    return responseData;
  }

  async getPaginateDataFormTotalDocs(
    totalDocs: number,
    page: number,
    limit: number,
  ) {
    const totalPages = totalDocs < limit ? 1 : Math.ceil(totalDocs / limit);
    const skip = page <= 1 ? 0 : (page - 1) * limit;
    const pagingCounter = skip + 1;
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
    const prevPage = hasPrevPage ? page - 1 : null;
    const nextPage = hasNextPage ? page + 1 : null;

    return {
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    };
  }

  async checkScheduleDateConflict(filter, startDate, endDate) {
    // Query to find any overlapping appointment
    let conflictQuery: any = {
      $or: [
        {
          scheduleStartDate: { $lt: new Date(endDate) },
          scheduleEndDate: { $gt: new Date(startDate) },
        },
        {
          scheduleStartDate: { $lte: new Date(startDate) },
          scheduleEndDate: { $gte: new Date(endDate) },
        },
      ],
    };

    conflictQuery = {
      ...conflictQuery,
      ...filter,
    };

    const conflictingAppointments = await this.requestModel.findOne(
      conflictQuery,
    );

    return conflictingAppointments;
  }

  async acceptScheduledRequestByTherapist(
    therapist: IUserDocument,
    requestId: string,
    clientSession: ClientSession,
  ) {
    const request = await this.getSessionRequest(requestId);

    if (!request) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (therapist.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(
        `You can't accept session request beacuse of your account is not active.`,
      );
    }

    if (request.therapist != therapist.id) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (request.requestStatus !== REQUEST_STATUS.OPEN_SCHEDULE) {
      throw new BadRequestException(`Request already ${request.requestStatus}`);
    }

    const userId = request.user._id.toHexString();

    const { deductAmount, extraCharge } =
      await this.walletRepository.getDeduction(
        userId,
        request.scheduleSessionDuration,
        therapist._id.toHexString(),
      );

    const totalDeductAmount = deductAmount + extraCharge;
    const userWallet = await this.walletRepository.getWalletByUserId(userId);

    if (userWallet.mainBalance < totalDeductAmount) {
      throw new BadRequestException(`User has insufficient balance.`);
    }

    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist._id.toHexString(),
    );
    const userProfile = await this.userRepository.getUserProfile(userId);
    const user = await this.userRepository.getUserById(userId);

    // create transaction
    const transaction =
      await this.walletRepository.commitTransactionOnScheduledRequestAccepted(
        userId,
        therapist.id,
        request.scheduleSessionDuration,
        clientSession,
      );

    const sessionData = {
      user: new Types.ObjectId(userId),
      therapist: new Types.ObjectId(therapist.id),
      sessionPrice: transaction.amount,
      duration: request.scheduleSessionDuration,
      sessionType: SESSION_TYPE.PRIVATE,
      sessionStartTime: request.scheduleStartDate,
      request: request._id,
      tid: transaction.tid,
    };

    const scheduledSession = await this.sessionRepository.scheduleSessionNew(
      sessionData,
      clientSession,
    );

    request.tid = transaction.tid;
    request.sessionId = scheduledSession._id;
    request.requestStatus = REQUEST_STATUS.SCHEDULED;
    await request.save({ session: clientSession });

    // request.acceptedBy.push({
    //   user: therapist._id,
    //   streamId: body.streamId,
    //   acceptedAt: new Date(),
    // });

    // await this.socketGateway.sendMessageToActiveUsers(
    //   NOTIFICATION_TYPE.REQUEST_ACCEPTED,
    //   [userId],
    //   {
    //     ...scheduledSession.toObject(),
    //     acceptedBy: {
    //       ...therapist,
    //       profile: therapistProfile.toJSON(),
    //     },
    //   },
    // );

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_SCHEDULED,
      [userId],
      scheduledSession,
    );

    const time = moment(request.scheduleStartDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    // send mail
    this.eventEmitter.emit(events.SCHEDULED_REQUEST_ACCEPTED, {
      therapistName: `${therapist.firstName} ${therapist.lastName}`,
      therapistEmail: therapist.email,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      time: time,
    });

    // send sms
    this.eventEmitter.emit(events.CUSTOM_SMS_SEND, {
      phoneNumbers: [userProfile.phoneNumber, therapistProfile.phoneNumber],
      body: `You have sheduled session on ${time}.`,
    });

    const before5Minutes = moment(request.scheduleStartDate)
      .subtract(5, 'minutes')
      .toDate();

    const phoneNumbers = [
      userProfile.phoneNumber,
      therapistProfile.phoneNumber,
    ];

    // schedule job for send sms and mail before 5 minutes
    await this.agendaAppService.scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob(
      {
        runAt: before5Minutes,
        requestId: requestId,
        therapistName: `${therapist.firstName} ${therapist.lastName}`,
        therapistEmail: therapist.email,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        time: time,
        phoneNumbers: phoneNumbers,
      },
    );

    return scheduledSession;
  }

  async rejectScheduledRequestByTherapist(
    therapist: IUserDocument,
    requestId: string,
    clientSession: ClientSession,
  ) {
    const request = await this.getSessionRequest(requestId);

    if (!request) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (therapist.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(
        `You can't accept session request beacuse of your account is not active.`,
      );
    }

    if (request.therapist != therapist.id) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (request.requestStatus !== REQUEST_STATUS.OPEN_SCHEDULE) {
      throw new BadRequestException(`Request already ${request.requestStatus}`);
    }

    const userId = request.user._id.toHexString();
    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist._id.toHexString(),
    );
    const userProfile = await this.userRepository.getUserProfile(userId);
    const user = await this.userRepository.getUserById(userId);

    request.requestStatus = REQUEST_STATUS.REJECTED;
    request.rejectedBy.push(therapist._id.toHexString());

    await request.save({ session: clientSession });

    // await this.socketGateway.sendMessageToActiveUsers(
    //   NOTIFICATION_TYPE.REQUEST_REJECTED,
    //   [userId],
    //   {
    //     ...request.toObject(),
    //     rejectedBy: {
    //       ...therapist,
    //       profile: therapistProfile.toJSON(),
    //     },
    //   },
    // );

    const time = moment(request.scheduleStartDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    // send mail
    this.eventEmitter.emit(events.SCHEDULED_REQUEST_REJECTED, {
      therapistName: `${therapist.firstName} ${therapist.lastName}`,
      therapistEmail: therapist.email,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      time: time,
    });

    // send sms
    this.eventEmitter.emit(events.CUSTOM_SMS_SEND, {
      phoneNumbers: [userProfile.phoneNumber, therapistProfile.phoneNumber],
      body: `Your scheduled session on ${time} was rejected`,
    });

    return request;
  }

  async jobTest(
    therapist: IUserDocument,
    requestId: string,
    clientSession: ClientSession,
  ) {
    const request = await this.getSessionRequest(requestId);
    const userId = request.user._id.toHexString();
    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist._id.toHexString(),
    );
    const userProfile = await this.userRepository.getUserProfile(userId);
    const user = await this.userRepository.getUserById(userId);

    const time = moment(request.scheduleStartDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    const before5Minutes = moment(request.scheduleStartDate)
      .subtract(5, 'minutes')
      .toDate();

    // const before5Minutes = moment().add(10, 'seconds').toDate();

    const phoneNumbers = [
      userProfile.phoneNumber,
      therapistProfile.phoneNumber,
    ];

    await this.agendaAppService.scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob(
      {
        runAt: before5Minutes,
        requestId: requestId,
        therapistName: `${therapist.firstName} ${therapist.lastName}`,
        therapistEmail: therapist.email,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        time: time,
        phoneNumbers: phoneNumbers,
      },
    );

    return request;
  }

  async acceptScheduledRequestByTherapistWithoutHold(
    therapist: IUserDocument,
    requestId: string,
    body: AcceptRequestDto,
    clientSession: ClientSession,
  ) {
    const request = await this.getSessionRequest(requestId);

    if (!request) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (therapist.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(
        `You can't accept session request beacuse of your account is not active.`,
      );
    }

    if (request.therapist != therapist.id) {
      throw new BadRequestException(`Invalid request.`);
    }

    if (request.requestStatus !== REQUEST_STATUS.OPEN_SCHEDULE) {
      throw new BadRequestException(`Request already ${request.requestStatus}`);
    }

    const userId = request.user._id.toHexString();

    // const { deductAmount, extraCharge } =
    //   await this.walletRepository.getDeduction(
    //     userId,
    //     request.scheduleSessionDuration,
    //     therapist._id.toHexString(),
    //   );

    // const totalDeductAmount = deductAmount + extraCharge;
    // const userWallet = await this.walletRepository.getWalletByUserId(userId);

    // if (userWallet.mainBalance < totalDeductAmount) {
    //   throw new BadRequestException(`User has insufficient balance.`);
    // }

    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist._id.toHexString(),
    );
    const userProfile = await this.userRepository.getUserProfile(userId);
    const user = await this.userRepository.getUserById(userId);

    // create transaction
    // const transaction =
    //   await this.walletRepository.commitTransactionOnScheduledRequestAccepted(
    //     userId,
    //     therapist.id,
    //     request.scheduleSessionDuration,
    //     clientSession,
    //   );

    // const sessionData = {
    //   user: new Types.ObjectId(userId),
    //   therapist: new Types.ObjectId(therapist.id),
    //   sessionPrice: transaction.amount,
    //   duration: request.scheduleSessionDuration,
    //   sessionType: SESSION_TYPE.PRIVATE,
    //   sessionStartTime: request.scheduleStartDate,
    //   request: request._id,
    //   tid: transaction.tid,
    // };

    const scheduledSession =
      await this.sessionRepository.createSessionFromRequest(
        request,
        therapist,
        body,
        clientSession,
      );

    request.sessionId = scheduledSession._id;
    request.requestStatus = REQUEST_STATUS.SCHEDULED;
    await request.save({ session: clientSession });

    // request.acceptedBy.push({
    //   user: therapist._id,
    //   streamId: body.streamId,
    //   acceptedAt: new Date(),
    // });

    // await this.socketGateway.sendMessageToActiveUsers(
    //   NOTIFICATION_TYPE.REQUEST_ACCEPTED,
    //   [userId],
    //   {
    //     ...scheduledSession.toObject(),
    //     acceptedBy: {
    //       ...therapist,
    //       profile: therapistProfile.toJSON(),
    //     },
    //   },
    // );

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_SCHEDULED,
      [userId],
      scheduledSession,
    );

    const time = moment(request.scheduleStartDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    // send mail
    this.eventEmitter.emit(events.SCHEDULED_REQUEST_ACCEPTED, {
      therapistName: `${therapist.firstName} ${therapist.lastName}`,
      therapistEmail: therapist.email,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      time: time,
    });

    // send sms
    this.eventEmitter.emit(events.CUSTOM_SMS_SEND, {
      phoneNumbers: [userProfile.phoneNumber, therapistProfile.phoneNumber],
      body: `You have sheduled session on ${time}.`,
    });

    const before5Minutes = moment(request.scheduleStartDate)
      .subtract(5, 'minutes')
      .toDate();

    const phoneNumbers = [
      userProfile.phoneNumber,
      therapistProfile.phoneNumber,
    ];

    // schedule job for send sms and mail before 5 minutes
    await this.agendaAppService.scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob(
      {
        runAt: before5Minutes,
        requestId: requestId,
        therapistName: `${therapist.firstName} ${therapist.lastName}`,
        therapistEmail: therapist.email,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        time: time,
        phoneNumbers: phoneNumbers,
      },
    );

    return scheduledSession;
  }

  async createScheduledSessionRequestByTherapist(
    dto: CreateScheduleRequestByTherapistDto,
    therapistId: Types.ObjectId,
    clientSession: ClientSession,
  ) {
    const { userId, startDate, duration } = dto;

    const therapist = await this.userRepository.getUserById(
      therapistId.toHexString(),
    );
    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapistId.toHexString(),
    );

    const user = await this.userRepository.getUserById(userId);
    const userProfile = await this.userRepository.getUserProfile(userId);

    const endDate = moment(new Date(startDate)).add(duration, 'minute');
    const startDateDate = moment(new Date(startDate));

    if (!user || !user.roles.includes(ROLE.USER)) {
      throw new BadRequestException('User does not exists.');
    }

    // check is user scheduled any appointment on same time or not
    const isUserBusy = await this.checkScheduleDateConflict(
      {
        user: user,
        requestStatus: {
          $in: [REQUEST_STATUS.OPEN_SCHEDULE, REQUEST_STATUS.SCHEDULED],
        },
      },
      startDate,
      endDate,
    );

    if (isUserBusy) {
      throw new BadRequestException('User has already another appointmnet.');
    }

    // check is therapist scheduled any appointment on same time or not
    const isTherapistBusy = await this.checkScheduleDateConflict(
      {
        therapist: therapistId,
        requestStatus: {
          $in: [REQUEST_STATUS.OPEN_SCHEDULE, REQUEST_STATUS.SCHEDULED],
        },
      },
      startDate,
      endDate,
    );

    if (isTherapistBusy) {
      throw new BadRequestException(
        'Therapist has already another appointmnet.',
      );
    }

    const categories = userProfile.categories;
    const query = 'Therapist want to schedule appointment';
    const requestType = REQUEST_TYPE.PRIVATE_SPECIFIC_THERAPIST;
    const requestStatus = REQUEST_STATUS.SCHEDULED;

    const request = new this.requestModel({
      categories,
      query,
      requestType,
      requestStatus,
      user,
      therapist: therapistId,
      scheduleSessionDuration: dto.duration,
      scheduleStartDate: startDateDate,
      scheduleEndDate: endDate,
    });

    await request.save({ session: clientSession });

    const scheduledSession =
      await this.sessionRepository.createSessionFromRequest(
        request,
        user,
        dto,
        clientSession,
      );

    request.sessionId = scheduledSession._id;
    await request.save({ session: clientSession });

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.SESSION_SCHEDULED,
      [userId],
      scheduledSession,
    );

    const time = moment(request.scheduleStartDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    // send mail
    this.eventEmitter.emit(events.SCHEDULED_REQUEST_ACCEPTED, {
      therapistName: `${therapist.firstName} ${therapist.lastName}`,
      therapistEmail: therapist.email,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      time: time,
    });

    // send sms
    this.eventEmitter.emit(events.CUSTOM_SMS_SEND, {
      phoneNumbers: [userProfile.phoneNumber, therapistProfile.phoneNumber],
      body: `You have sheduled session on ${time}.`,
    });

    const before5Minutes = moment(request.scheduleStartDate)
      .subtract(5, 'minutes')
      .toDate();

    const phoneNumbers = [
      userProfile.phoneNumber,
      therapistProfile.phoneNumber,
    ];

    // schedule job for send sms and mail before 5 minutes
    await this.agendaAppService.scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob(
      {
        runAt: before5Minutes,
        requestId: request.id,
        therapistName: `${therapist.firstName} ${therapist.lastName}`,
        therapistEmail: therapist.email,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        time: time,
        phoneNumbers: phoneNumbers,
      },
    );

    return request;
  }

  async updateScheduledRequestType() {
    return await this.requestModel.updateMany(
      {
        query: {
          $in: [
            'I want to schedule appointment',
            'Therapist want to schedule appointment',
          ],
        },
      },
      {
        requestType: REQUEST_TYPE.PRIVATE_SPECIFIC_THERAPIST,
      },
    );
  }
}
