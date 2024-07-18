import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '@repositories/session.repository';
import { CreateSessionDto } from './dto/create-session.dto';
import { IRequest, ISessionDocument } from '@interfaces';
import { ScheduleSessionDto } from './dto/schedule-session.dto';
import {
  ClientSession,
  FilterQuery,
  PaginateOptions,
  PopulateOptions,
} from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@events';
import { PingDto } from '@modules/socket/dto/ping.dto';
import { RiseHandDto } from '@modules/socket/dto/rise-hand.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(private readonly sessionRepository: SessionRepository) {}

  async createSession(request: IRequest, session: CreateSessionDto) {
    const nSession = await this.sessionRepository.createSession(
      request.user._id,
      session,
    );
    return nSession;
  }

  // async handlePingNotReceived(session: ClientSession) {
  //   await this.sessionRepository.handlePingNotReceived(session);
  // }

  async scheduleSession(
    sessionId: string,
    dto: ScheduleSessionDto,
    mongoSession: ClientSession,
  ) {
    const session = await this.sessionRepository.scheduleSession(
      sessionId,
      dto,
      mongoSession,
    );
    return session;
  }

  @OnEvent(events.PING_RECEIVED, { async: true })
  async handlePingReceived(payload: PingDto, user: string) {
    try {
      await this.sessionRepository.updatePing(payload, user);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(events.SESSION_FEE_UPDATE, { async: true })
  async handleSessionFeeUpdate(transaction: string, fee: number) {
    await this.sessionRepository.updateSessionFee(transaction, fee);
  }

  @OnEvent(events.SESSION_RISE_HAND, { async: true })
  async handleRiseHand(payload: RiseHandDto) {
    await this.sessionRepository.handleRiseHand(
      payload.sessionId,
      payload.userId,
    );
  }

  // async handleMinuteCompleted(session: ClientSession) {
  //   return await this.sessionRepository.handleMinuteCompleted(session);
  // }

  async joinSession(sessionId: string, userId: string) {
    const session = await this.sessionRepository.joinSession(sessionId, userId);
    return session;
  }

  async acceptScheduledSession(sessionId: string, streamId: string) {
    const session = await this.sessionRepository.acceptScheduledSession(
      sessionId,
      streamId,
    );
    return session;
  }

  async rejectSession(sessionId: string) {
    const session = await this.sessionRepository.rejectSession(sessionId);
    return session;
  }

  async leaveSession(
    sessionId: string,
    user: string,
    mongoSession: ClientSession,
  ) {
    const session = await this.sessionRepository.leaveSession(
      sessionId,
      user,
      mongoSession,
    );
    return session;
  }

  async getAllSessions(
    filter: FilterQuery<ISessionDocument>,
    options: PaginateOptions,
  ) {
    const sessions = await this.sessionRepository.getAllSessions(
      filter,
      options,
    );
    return sessions;
  }

  async sendUpcomingSessionNotification() {
    await this.sessionRepository.sendUpcomingNotification();
  }

  async getSessionById(
    sessionId: string,
    populate?: PopulateOptions | PopulateOptions[],
  ) {
    const session = await this.sessionRepository.getSessionById(
      sessionId,
      populate,
    );
    return session;
  }

  async riseHandApi(sessionId: string, userId: string) {
    const session = await this.sessionRepository.riseHandApi(sessionId, userId);
    return session;
  }

  async storeTranscriptInDB(streamId: string, transcript: string) {
    const session = await this.sessionRepository.storeTranscriptInDB(
      streamId,
      transcript,
    );
    return session;
  }

  async startRecording(streamId: string, url: string) {
    const session = await this.sessionRepository.startRecording(streamId, url);
    return session;
  }

  async stopRecording(streamId: string) {
    const session = await this.sessionRepository.stopRecording(streamId);
    return session;
  }

  async getConnectedSessions(
    filter: FilterQuery<ISessionDocument>,
    options: PaginateOptions,
  ) {
    const sessions = await this.sessionRepository.getConnectedSessions(
      filter,
      options,
    );
    return sessions;
  }

  async endSession123(userId: string) {
    const session = await this.sessionRepository.endSession123(userId);
    return session;
  }

  async getPendingSession(userId: string) {
    const session = await this.sessionRepository.getPendingSession(userId);
    return session;
  }

  async showTranscript(sessionId: string) {
    const transcript = await this.sessionRepository.showTranscript(sessionId);
    return transcript;
  }

  async getInSessionTherapistIds() {
    const therapistIds =
      await this.sessionRepository.getInSessionTherapistIds();
    return therapistIds;
  }
}
