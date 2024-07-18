import { BadRequestException, Injectable } from '@nestjs/common';
import { ClientSession, FilterQuery, PaginateOptions } from 'mongoose';
import { UserRepository } from '@repositories/user.repository';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { ITherapistProfileDocument, IUserDocument } from '@interfaces';
import { TokenService } from '@modules/token/token.service';
import { createOTP } from '@utils/otp.util';
import { ROLE, TOKEN_TYPE } from '@enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@events';
import {
  CreateTherapistDto,
  RegisterTherapistDto,
} from './dto/create-therapist.dto';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateTherapistDto } from './dto/update-therapist.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateTherapistStatusDto } from './dto/update-status.dto';
import { NewRegisterUserDto } from './dto/new-create-user.dto';
import { TherapistRejectDto } from './dto/therapist-reject.dto';
import { SourceGeneratedReferralDto } from './dto/source-generated-refferal.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createUser(
    createUserDto: CreateUserDto | RegisterUserDto,
    role: ROLE,
    session: ClientSession,
  ) {
    const user = await this.userRepository.createUser(
      createUserDto,
      role,
      session,
    );

    await this.userRepository.createUserProfile(user, createUserDto, session);

    return user;
  }

  async getTherapistDetails(user: string) {
    return await this.userRepository.getTherapistDetails(user);
  }

  async getTherapistProfile(id: string) {
    return await this.userRepository.getTherapistProfile(id);
  }

  async getUserDetails(user: string) {
    return await this.userRepository.getUserDetails(user);
  }

  async updateTherapistProfile(
    therapist: string,
    dto: UpdateTherapistProfileDto,
  ) {
    return await this.userRepository.updateTherapistProfile(therapist, dto);
  }

  async createTherapist(
    createTherapistDto: CreateTherapistDto | RegisterTherapistDto,
    session: ClientSession,
  ) {
    const user = await this.userRepository.createUser(
      createTherapistDto,
      ROLE.THERAPIST,
      session,
    );

    await this.userRepository.createTherapistProfile(
      user,
      createTherapistDto,
      session,
    );
    return user;
  }

  async getUserById(id: string) {
    return await this.userRepository.getUserById(id);
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.getUserByEmail(email);
  }

  async sendVerificationEmail(user: IUserDocument, session: ClientSession) {
    const otp = createOTP();
    await this.tokenService.createOTP(
      {
        userId: user.id,
        token: otp,
        tokenType: TOKEN_TYPE.EMAIL_VERIFICATION,
      },
      session,
    );

    Object.assign(user, { emailVerified: false });
    await user.save({ session });

    return user;
  }

  async verifyEmail(user: IUserDocument, session: ClientSession) {
    return await this.userRepository.verifyEmail(user, session);
  }

  async changePassword(
    userId: string,
    { oldPassword, newPassword }: { oldPassword?: string; newPassword: string },
    session: ClientSession,
  ) {
    const user = await this.userRepository.getUserById(userId);
    if (oldPassword) {
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        throw new BadRequestException('Old password is incorrect');
      }
    }

    user.password = newPassword;
    await user.save({ session });

    this.eventEmitter.emit(events.PASSWORD_CHANGED, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });
  }

  async sendPasswordResetEmail(email: string, session: ClientSession) {
    const user = await this.userRepository.getUserByEmail(email);
    const otp = createOTP();
    await this.tokenService.createOTP(
      {
        userId: user.id,
        token: otp,
        tokenType: TOKEN_TYPE.PASSWORD_RESET,
      },
      session,
    );

    this.eventEmitter.emit(events.PASSWORD_RESET, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      otp,
    });

    return user;
  }

  async updateUser(
    id: string,
    updateBody: UpdateProfileDto | ChangeStatusDto,
    session: ClientSession,
  ) {
    return await this.userRepository.updateUser(id, updateBody, session);
  }

  async updateTherapist(
    id: string,
    updateBody:
      | UpdateProfileDto
      | ChangeStatusDto
      | UpdateTherapistDto
      | UpdateTherapistProfileDto,
    session: ClientSession,
  ) {
    return await this.userRepository.updateTherapist(id, updateBody, session);
  }

  async getAllUserByRole(
    filter: FilterQuery<IUserDocument>,
    options: PaginateOptions,
  ) {
    return await this.userRepository.getAllUsers(filter, options);
  }

  async getProfile(userId: string, role: ROLE) {
    switch (role) {
      case ROLE.USER:
        return await this.userRepository.getUserProfile(userId);
      case ROLE.THERAPIST:
        return await this.userRepository.getTherapistProfile(userId);
      default:
        return null;
    }
  }

  async activeUser(userId: string, session: ClientSession) {
    return await this.userRepository.activeUser(userId, session);
  }

  async getTherapistsList() {
    return await this.userRepository.getTherapistsList();
  }

  async getFilteredTherapistsList(
    filter: FilterQuery<ITherapistProfileDocument>,
    options: PaginateOptions,
  ) {
    return await this.userRepository.getFilteredTherapistsList(filter, options);
  }

  async getUserCategories(userId: string) {
    return await this.userRepository.getUserCategories(userId);
  }

  async createAdmin(createAdminDto: CreateAdminDto, session: ClientSession) {
    const user = await this.userRepository.createAdmin(createAdminDto, session);

    this.eventEmitter.emit(events.USER_REGISTERED, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });
    return user;
  }

  async updateTherapistStatus(
    therapistId: string,
    updateStatusDto: UpdateTherapistStatusDto,
    session: ClientSession,
  ) {
    return await this.userRepository.updateStatus(
      therapistId,
      updateStatusDto,
      session,
    );
  }

  async getAllAdmins() {
    return await this.userRepository.getAllAdmins();
  }

  async getFilteredUsersList(
    filter: FilterQuery<ITherapistProfileDocument>,
    options: PaginateOptions,
  ) {
    return await this.userRepository.getFilteredUsersList(filter, options);
  }

  async newCreateUser(
    newCreateUserDto: NewRegisterUserDto,
    role: ROLE,
    session: ClientSession,
  ) {
    const user = await this.userRepository.newCreateUser(
      newCreateUserDto,
      role,
      session,
    );
    return user;
  }

  async getUserTokenData(userId: string) {
    return await this.userRepository.getUserTokenData(userId);
  }

  async deleteUserTokenData(userId: string) {
    return await this.userRepository.deleteUserTokenData(userId);
  }

  async createEmailTokenData(
    user: IUserDocument,
    token: string,
    session: ClientSession,
    VATnumber?: string,
  ) {
    await this.tokenService.createEmailTokenData(
      user,
      token,
      session,
      VATnumber,
    );

    Object.assign(user, { emailVerified: false });
    await user.save({ session });
    await this.sendWelcomeEMail(user, token);

    return user;
  }

  async sendWelcomeEMail(user: IUserDocument, token: string) {
    this.eventEmitter.emit(events.USER_REGISTERED, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      token,
    });

    const adminUsers = await this.getAllAdmins();

    let isTherapist = false;
    if (user.roles.includes(ROLE.THERAPIST)) {
      isTherapist = true;
    }

    await this.eventEmitter.emit(events.USER_JOINED, {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      admins: adminUsers,
      isTherapistJoined: isTherapist,
    });
  }

  async getTokenByToken(token: string) {
    return await this.tokenService.getTokenByToken(token);
  }

  async removeUserById(userId: string) {
    return await this.userRepository.removeUserById(userId);
  }

  async removeUserProfile(userId: string) {
    return await this.userRepository.removeUserProfile(userId);
  }

  async removeTherapistProfile(userId: string) {
    return await this.userRepository.removeTherapistProfile(userId);
  }

  async sysGeneratedReferral(numOfRecords: number, session: ClientSession) {
    return await this.userRepository.createDefaultSystemGeneratedReferralCode(
      numOfRecords,
      session,
    );
  }

  async getAllReferralUsers() {
    return await this.userRepository.getAllReferralUsers();
  }

  async rejectTherapist(rejectTherapistDto: TherapistRejectDto) {
    return await this.userRepository.rejectTherapist(rejectTherapistDto);
  }

  async generateTwoStepVerificationOtp(
    user: IUserDocument,
    session: ClientSession,
    VATnumber?: string,
  ) {
    const otp = createOTP();
    await this.tokenService.createOTP(
      {
        userId: user.id,
        token: otp,
        tokenType: TOKEN_TYPE.TWO_STEP_VERIFICATION,
        extraData: {
          roles: user.roles,
          VATnumber: VATnumber,
        },
      },
      session,
    );

    await user.save({ session });
    await this.generateTwoStepVerificationMail(user, otp);

    return user;
  }

  async generateTwoStepVerificationMail(user: IUserDocument, token: string) {
    this.eventEmitter.emit(events.TWO_STEP_VERIFICATION, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      token,
    });
  }

  async generateTOTP(user: IUserDocument) {
    const secretData = await this.userRepository.generateTOTP(user);
    return secretData;
  }

  async verifyTOTP(user: IUserDocument, token: string) {
    const secretData = await this.userRepository.verifyTOTP(user, token);
    return secretData;
  }

  async createSourceGeneratedReferralCode(
    sourceGeneratedReferralDto: SourceGeneratedReferralDto,
    session: ClientSession,
  ) {
    return await this.userRepository.createSourceGeneratedReferralCode(
      sourceGeneratedReferralDto,
      session,
    );
  }

  async getSystemGeneratedReferralCode() {
    return await this.userRepository.getSystemGeneratedReferralCode();
  }

  async closeAccount(userId: string) {
    return await this.userRepository.closeAccount(userId);
  }

  async updateAllUserStatus(userId: string, status: string) {
    return await this.userRepository.updateAllUserStatus(userId, status);
  }

  async multiUserCloseAccount(emails: string[]) {
    return await this.userRepository.multiUserCloseAccount(emails);
  }
}
