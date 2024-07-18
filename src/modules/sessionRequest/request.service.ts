import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestRepository } from '@repositories/request.repository';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ISessionRequestDocument, IUserDocument } from '@interfaces';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { REQUEST_STATUS } from 'src/types/enums';
import { ClientSession, FilterQuery, PaginateOptions, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@events';
import { UpdateRequestSessionDto } from './dto/update-request-session.dto';
import { UserService } from '@modules/user/user.service';
import { CreateScheduleRequestDto } from './dto/create-schedule-request.dto';
import { CreateScheduleRequestByTherapistDto } from './dto/create-schedule-request-by-therapist.dto';

@Injectable()
export class RequestService {
  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly userService: UserService,
  ) {}
  async getSessionRequests(
    filter: FilterQuery<ISessionRequestDocument>,
    options: PaginateOptions,
  ) {
    const requests = await this.requestRepository.getSessionRequests(
      filter,
      options,
    );
    return requests;
  }

  async getInPoolRequests(user: IUserDocument, options: PaginateOptions) {
    const requests = await this.requestRepository.getInPoolRequests(
      user,
      REQUEST_STATUS.IN_POOL,
      options,
    );
    return requests;
  }

  async getScheduledRequests(
    filter: FilterQuery<ISessionRequestDocument>,
    options?: PaginateOptions,
  ) {
    const requests = await this.requestRepository.getScheduledRequests(
      filter,
      options,
    );
    return requests;
  }

  async getTherapistRequests(
    user: IUserDocument,
    filter: FilterQuery<ISessionRequestDocument>,
    options: PaginateOptions,
  ) {
    const profile = await this.userService.getTherapistProfile(user._id);
    filter['categories'] = { $in: profile.categories };
    filter['rejectedBy'] = { $nin: [user._id] };

    const requests = await this.requestRepository.getTherapistRequests(
      filter,
      options,
    );
    return requests;
  }

  @OnEvent(events.REQUEST_STATUS_UPDATED, { async: true })
  async handleUpdateRequestStatus(
    request: string,
    payload: UpdateRequestSessionDto,
  ) {
    return this.requestRepository.updateRequestStatus(request, payload);
  }

  async acceptTherapistRequest(
    user: IUserDocument,
    requestId: string,
    body: AcceptRequestDto,
    session: ClientSession,
  ) {
    const request = await this.requestRepository.acceptTherapistRequest(
      user,
      requestId,
      body,
      session,
    );
    return request;
  }

  async getRequestById(id: string) {
    const request = await this.requestRepository.getSessionRequest(id);
    return request;
  }

  async createRequest(
    body: CreateRequestDto,
    user: Types.ObjectId,
    session: ClientSession,
  ) {
    const request = await this.requestRepository.createSessionRequest(
      body,
      user,
      session,
    );
    return request;
  }

  async updateRequest(user: string, id: string, body: UpdateRequestDto) {
    const request = await this.requestRepository.updateSessionRequest(
      user,
      id,
      body,
    );
    return request;
  }

  async handleRejectRequest(user: string, sessionRequestId: string) {
    const request = await this.requestRepository.handleRejectRequest(
      user,
      sessionRequestId,
    );
    return request;
  }

  async withdrawRequest(user: string, id: string, session: ClientSession) {
    const request = await this.requestRepository.withdrawSessionRequest(
      user,
      id,
      session,
    );
    return request;
  }

  async deleteRequest(id: string) {
    const request = await this.requestRepository.deleteSessionRequest(id);
    return request;
  }

  async createScheduledSessionRequest(
    dto: CreateScheduleRequestDto,
    user: Types.ObjectId,
    session: ClientSession,
  ) {
    const seesion = await this.requestRepository.createScheduledSessionRequest(
      dto,
      user,
      session,
    );
    return seesion;
  }

  async withdrawAllSessionRequest(user: string) {
    const request = await this.requestRepository.withdrawAllSessionRequest(
      user,
    );
    return request;
  }

  async getFilteredSessionsList(
    filter: FilterQuery<ISessionRequestDocument>,
    options: PaginateOptions,
  ) {
    return await this.requestRepository.getFilteredSessionsList(
      filter,
      options,
    );
  }

  async acceptScheduledRequestByTherapist(
    user: IUserDocument,
    requestId: string,
    body: AcceptRequestDto,
    session: ClientSession,
  ) {
    const request =
      await this.requestRepository.acceptScheduledRequestByTherapistWithoutHold(
        user,
        requestId,
        body,
        session,
      );
    return request;
  }

  async rejectScheduledRequestByTherapist(
    user: IUserDocument,
    requestId: string,
    session: ClientSession,
  ) {
    const request =
      await this.requestRepository.rejectScheduledRequestByTherapist(
        user,
        requestId,
        session,
      );
    return request;
  }

  async jobTest(
    user: IUserDocument,
    requestId: string,
    session: ClientSession,
  ) {
    const request = await this.requestRepository.jobTest(
      user,
      requestId,
      session,
    );
    return request;
  }

  async createScheduledSessionRequestByTherapist(
    dto: CreateScheduleRequestByTherapistDto,
    therapistId: Types.ObjectId,
    session: ClientSession,
  ) {
    const seesion =
      await this.requestRepository.createScheduledSessionRequestByTherapist(
        dto,
        therapistId,
        session,
      );
    return seesion;
  }

  async updateScheduledRequestType() {
    const seesion = await this.requestRepository.updateScheduledRequestType();
    return seesion;
  }
}
