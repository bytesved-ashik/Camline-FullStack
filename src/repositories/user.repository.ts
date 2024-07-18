import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FilterQuery,
  PaginateOptions,
  PaginateResult,
} from 'mongoose';
import {
  ICategoryModel,
  IMediaModel,
  ISessionModel,
  ITherapistProfileDocument,
  ITokenModel,
  ITwoFactorAuthModel,
  IUserDocument,
  IUserModel,
} from '@interfaces';
import { User } from '@entities/user.entity';
import { Wallet } from '@entities/wallet.entity';
import {
  CreateUserDto,
  RegisterUserDto,
} from '@modules/user/dto/create-user.dto';
import { IWalletModel } from '@interfaces';
import { Types } from 'mongoose';
import { TherapistProfile } from '@entities/therapist-profile.entity';
import {
  CreateTherapistDto,
  RegisterTherapistDto,
} from '@modules/user/dto/create-therapist.dto';
import { ITherapistProfileModel } from '@interfaces';
import { UserProfile } from '@entities/user-profile.entity';
import { IUserProfileModel } from '@interfaces';
import {
  ROLE,
  SESSION_STATUS,
  SESSION_TYPE,
  TOKEN_TYPE,
  USER_STATUS,
} from 'src/types/enums';
import { UpdateTherapistProfileDto } from '@modules/user/dto/update-therapist-profile.dto';
import { UpdateProfileDto } from '@modules/user/dto/update-profile.dto';
import { ChangeStatusDto } from '@modules/user/dto/change-status.dto';
import { IAvailabilityModel } from '@interfaces';
import { Availability } from '@entities/availability.entity';
import { UpdateTherapistDto } from '@modules/user/dto/update-therapist.dto';
import { replaceDescWithMinusOne } from '@utils/object.util';
import { REFERRAL_CODE_LENGTH } from '../modules/user/user.constant';
import { IReferralModel } from 'src/types/interfaces/entities/user-referral.interface';
import { Referral } from '@entities/user-referral.entity';
import { SESSION_CONSTANT, WALLET_CONSTANT } from '@constants/index';
import { CreateAdminDto } from '@modules/user/dto/create-admin.dto';
import { UpdateTherapistStatusDto } from '@modules/user/dto/update-status.dto';
import { events } from '@events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Token } from '@entities/token.entity';
import { NewRegisterUserDto } from '@modules/user/dto/new-create-user.dto';
import { Category } from '@entities/category.entity';
import { SystemReferralCode } from '@entities/systemReferralCode.entity';
import { ISystemReferralCodeModel } from 'src/types/interfaces/entities/systemReferralCode.interface';
import { SystemConfigRepository } from './systemConfig.repository';
import { TherapistRejectDto } from '@modules/user/dto/therapist-reject.dto';
import { TwoFactorAuth } from '@entities/twoFactorAuth.entity';
import * as speakeasy from 'speakeasy';
import { SourceGeneratedReferralDto } from '@modules/user/dto/source-generated-refferal.dto';
import * as fs from 'fs';
import { Media } from '@entities/media.entity';
import { SessionRepository } from './session.repository';
import { Session } from '@entities/session.entity';

export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: IUserModel,
    @InjectModel(Wallet.name) private readonly walletModel: IWalletModel,
    @InjectModel(TherapistProfile.name)
    private readonly therapistProfile: ITherapistProfileModel,
    @InjectModel(UserProfile.name)
    private readonly userProfile: IUserProfileModel,
    @InjectModel(Availability.name)
    private readonly availabilityModel: IAvailabilityModel,
    @InjectModel(Referral.name)
    private readonly referralModel: IReferralModel,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(Token.name) private readonly tokenModel: ITokenModel,
    @InjectModel(Category.name) private readonly categoryModel: ICategoryModel,
    @InjectModel(SystemReferralCode.name)
    private readonly systemReferralCodeModel: ISystemReferralCodeModel,
    private readonly systemConfigRepository: SystemConfigRepository,
    @InjectModel(TwoFactorAuth.name)
    private readonly twoFactorAuthModel: ITwoFactorAuthModel,
    @InjectModel(Media.name) private readonly mediaModel: IMediaModel,
    @InjectModel(Session.name) private readonly sessionModel: ISessionModel,
  ) {}

  async createUser(
    createUserDto: CreateUserDto | RegisterUserDto | RegisterTherapistDto,
    role: ROLE,
    session: ClientSession,
  ) {
    let referralSourceUserId = null;
    let sysGeneratedReferralId = null;
    let isSystemReferral = false;
    let systemReferralData = null;
    let referralCode = null;

    if (await this.userModel.isEmailTaken(createUserDto.email))
      throw new ConflictException('Email already exists');

    if (createUserDto.referralCode) {
      const referralSourceUser = await this.getUserByReferralCode(
        createUserDto.referralCode,
      );
      if (!referralSourceUser) {
        systemReferralData = await this.getSysReferralCode(
          createUserDto.referralCode,
        );
      }

      if (!referralSourceUser && !systemReferralData) {
        throw new BadRequestException('Invalid referral code');
      }

      if (referralSourceUser) {
        referralSourceUserId = referralSourceUser._id;
        referralCode = referralSourceUser.referralCode;
      } else {
        sysGeneratedReferralId = systemReferralData._id;
        isSystemReferral = true;
        referralCode = systemReferralData.referralCode;
      }
    }

    let user = new this.userModel({
      ...createUserDto,
      roles: [role],
      status:
        role === ROLE.THERAPIST ? USER_STATUS.PENDING : USER_STATUS.ACTIVE,
      referralCode: await this.generateReferralCode(REFERRAL_CODE_LENGTH),
      isTwoStepVerified: false,
    });
    try {
      user = await user.save({ session });

      if (createUserDto.referralCode) {
        await this.saveReferralUsers(
          referralSourceUserId,
          user._id,
          isSystemReferral,
          sysGeneratedReferralId,
          referralCode,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return user;
  }

  async createUserProfile(
    user: IUserDocument,
    dto: CreateUserDto | RegisterUserDto,
    session: ClientSession,
  ) {
    const wallet = this.getWallet(user);
    const profile = new this.userProfile({
      ...dto,
      user: new Types.ObjectId(user._id),
    });
    await wallet.save({ session });
    await profile.save({ session });
  }

  async createTherapistProfile(
    user: IUserDocument,
    dto: RegisterTherapistDto | CreateTherapistDto,
    session: ClientSession,
  ) {
    if (dto.VATNumber) {
      const checkVATNumber = await this.therapistProfile.findOne({
        VATNumber: dto.VATNumber,
      });

      if (checkVATNumber) {
        throw new BadRequestException('VAT Number already exists.');
      }
    }
    const wallet = this.getWallet(user);
    const profile = new this.therapistProfile({
      ...dto,
      user: new Types.ObjectId(user._id),
    });
    await wallet.save({ session });
    await profile.save({ session });
  }

  getWallet(user: IUserDocument) {
    return new this.walletModel({
      user: user._id,
      mainBalance: 0,
      bonusBalance: 0,
      holdedMainBalance: 0,
      holdedBonusBalance: 0,
      freeTrialMinutes: WALLET_CONSTANT.FREE_TRIAL_MINUTE,
    });
  }

  async getTherapistProfileByCategory(
    categories: Array<Types.ObjectId>,
  ): Promise<ITherapistProfileDocument[]> {
    return this.therapistProfile.find({
      categories: {
        $in: categories,
      },
    });
  }

  async getTherapistDetails(therapistId: string) {
    const profile = await this.userModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(therapistId) }, // Match the user by ID
      },
      {
        $lookup: {
          from: 'therapistprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unset: 'password',
      },
      {
        $lookup: {
          from: 'media',
          localField: 'profile.profilePicture',
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
      {
        $lookup: {
          from: 'categories',
          localField: 'profile.categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $lookup: {
          from: 'media',
          localField: 'profile.medias.mediaId',
          foreignField: '_id',
          as: 'medias',
        },
      },
    ]);

    const availability = await this.availabilityModel
      .findOne({
        userId: therapistId,
      })
      .exec();

    profile[0].availability = availability;

    const inSessionTherapistIds = await this.getInSessionTherapistIds();
    const isTherapistInsession = inSessionTherapistIds.includes(
      profile[0]._id.toHexString(),
    );

    profile[0].isInSession = isTherapistInsession ? true : false;

    return profile;
  }

  async getUserDetails(userId: string) {
    const profile = await this.userModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(userId) }, // Match the user by ID
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unset: 'password',
      },
      {
        $lookup: {
          from: 'media',
          localField: 'profile.profilePicture',
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
      {
        $lookup: {
          from: 'categories',
          localField: 'profile.categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
    ]);

    if (profile && profile.length > 0) {
      const wallet = await this.walletModel.findOne({ user: profile[0]._id });

      profile[0].wallet = wallet;

      let paidMinutes = 0;
      let freeTrialMinutes = 0;

      if (wallet) {
        const CALL_CHARGE_PER_MINUTE =
          await this.systemConfigRepository.getCallChargePerMinute();

        paidMinutes = Number(
          (wallet.mainBalance / CALL_CHARGE_PER_MINUTE).toFixed(2),
        );
        freeTrialMinutes = Number(wallet.freeTrialMinutes.toFixed(2));
      }

      profile[0].paidMinutes = paidMinutes;
      profile[0].freeTrialMinutes = freeTrialMinutes;

      const activeSessionsCount = (await this.getActiveSessions(profile[0]._id))
        .length;

      profile[0].isInSession = activeSessionsCount > 0 ? true : false;
    }

    return profile;
  }

  async getTherapistProfile(therapistId: string) {
    const profile = this.therapistProfile
      .findOne({
        user: new Types.ObjectId(therapistId),
      })
      .select('-deductionPercentage');

    return profile;
  }

  async getUserProfile(userId: string) {
    const profile = this.userProfile.findOne({
      user: new Types.ObjectId(userId),
    });

    return profile;
  }

  async updateTherapistProfile(
    therapist: string,
    dto: UpdateTherapistProfileDto,
  ) {
    return await this.therapistProfile.findOneAndUpdate(
      { user: new Types.ObjectId(therapist) },
      {
        $set: { ...dto },
      },
    );
  }

  async createTherapist(
    createUserDto: CreateTherapistDto | RegisterTherapistDto,
    session: ClientSession,
  ) {
    if (await this.userModel.isEmailTaken(createUserDto.email))
      throw new ConflictException('Email already exists');

    let user = new this.userModel(createUserDto);
    const wallet = this.getWallet(user);
    const profile = new this.therapistProfile({
      ...createUserDto,
      user: user._id,
    });
    try {
      user = await user.save({ session });
      // wallet = await wallet.save({ session });
      // profile = await profile.save({ session });
      await wallet.save({ session });
      await profile.save({ session });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return user;
  }

  async disconnectUser(clientId: string) {
    const user = await this.userModel.findOneAndUpdate(
      { clientId },
      { $set: { clientId: null, isOnline: false } },
    );
    return user;
  }

  async getOnlineUsers(ids: string[]) {
    const nIds = ids.map((id) => new Types.ObjectId(id));
    const user = await this.userModel.find({
      $and: [{ _id: { $in: nIds } }, { isOnline: true }],
    });
    return user;
  }

  async addOnlineUser(userId: string, clientId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      $set: { clientId: clientId, isOnline: true },
    });
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id);
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });

    return user;
  }

  async verifyEmail(user: IUserDocument, session: ClientSession) {
    try {
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { emailVerified: true } },
        session,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async updateUser(
    id: string,
    updateParams: UpdateProfileDto | ChangeStatusDto,
    session: ClientSession,
  ) {
    const user = await this.getUserById(id);
    const profile = await this.userProfile.findOne({
      user: new Types.ObjectId(id),
    });

    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, updateParams);
    Object.assign(profile, updateParams);
    await user.save({ session });
    await profile.save({ session });
    return user;
  }

  async updateTherapist(
    id: string,
    updateParams:
      | UpdateProfileDto
      | ChangeStatusDto
      | UpdateTherapistDto
      | UpdateTherapistProfileDto,
    session: ClientSession,
  ) {
    const user = await this.getUserById(id);
    const profile = await this.therapistProfile.findOne({
      user: new Types.ObjectId(id),
    });

    if (!user) throw new NotFoundException('User not found');

    // send email on update profile of rejected therapist
    if (user.status == USER_STATUS.REJECT) {
      const adminUsers = await this.getAllAdmins();

      this.eventEmitter.emit(events.REJECTED_THERAPIST_PROFILE_UPDATE, {
        therapistName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        rejectReason: user.rejectReason,
        admins: adminUsers,
      });
    }

    Object.assign(user, updateParams);
    Object.assign(profile, updateParams);
    await user.save({ session });
    await profile.save({ session });
    return user;
  }

  async getAllUsers(
    filter: FilterQuery<IUserDocument>,
    options: PaginateOptions,
  ) {
    const projects: PaginateResult<IUserDocument> =
      await this.userModel.paginate(filter, options);
    return projects;
  }

  async activeUser(userId: string, session: ClientSession) {
    try {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { status: USER_STATUS.ACTIVE } },
        session,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getTherapistsList() {
    const therapists = await this.therapistProfile
      .find({})
      .populate([
        {
          path: 'user',
          model: 'User',
        },
        {
          path: 'profilePicture',
          model: 'Media',
        },
        {
          path: 'categories',
          model: 'Category',
          select: 'name',
        },
        {
          path: 'medias.mediaId',
          model: 'Media',
        },
      ])
      .sort({ createdAt: -1 })
      .exec();

    return therapists;
  }

  async getFilteredTherapistsList(
    filter: FilterQuery<ITherapistProfileDocument>,
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
          from: 'media',
          localField: 'profilePicture',
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
      {
        $lookup: {
          from: 'media',
          localField: 'medias.mediaId',
          foreignField: '_id',
          as: 'medias',
        },
      },
      {
        $unwind: {
          path: '$medias.mediaId',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

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

    const therapists = await this.therapistProfile.aggregate(pipelines);

    return therapists;
  }

  async getUserCategories(userId: string): Promise<string[]> {
    const profile = await this.userProfile
      .findOne({
        user: userId,
      })
      .populate('categories');

    let categories = [];

    if (profile && profile.categories.length > 0) {
      categories = profile.categories.map((category: any) => category.name);
    }

    return categories;
  }

  async generateReferralCode(length) {
    const characters =
      'AB6CD57EFGHJ45KLMNPQ6543RSTUVW5XYZ4324abc8defgh2kmnp3424qrstu87vwxyz23456789';
    let referralCode = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters.charAt(randomIndex);
    }
    while (await this.isReferralCodeExists(referralCode)) {
      referralCode = await this.generateReferralCode(length);
    }

    return referralCode;
  }

  async isReferralCodeExists(referralCode: string) {
    const existingCode = await this.userModel.findOne({ referralCode });

    const isSystemRefCode = await this.systemReferralCodeModel.findOne({
      referralCode: referralCode,
    });

    if (existingCode || isSystemRefCode) {
      return true;
    } else {
      return false;
    }
  }

  async saveReferralUsers(
    sourceUserId: string,
    recipientUserId: string,
    isSystemReferral: boolean,
    sysGeneratedReferralId: string,
    referralCode: string,
  ) {
    const referral = new this.referralModel({
      referralSourceUserId: sourceUserId,
      referralRecipientUserId: recipientUserId,
      isSystemReferral: isSystemReferral,
      sysGeneratedReferralId: sysGeneratedReferralId,
      referralCode: referralCode,
    });
    await referral.save();
    return referral;
  }

  async getUserByReferralCode(referralCode: string) {
    const user = await this.userModel.findOne({ referralCode }).exec();
    return user;
  }

  async createAdmin(createAdminDto: CreateAdminDto, session: ClientSession) {
    if (await this.userModel.isEmailTaken(createAdminDto.email))
      throw new ConflictException('Email already exists');

    let user = new this.userModel({
      ...createAdminDto,
      roles: [ROLE.ADMIN],
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      referralCode: await this.generateReferralCode(REFERRAL_CODE_LENGTH),
    });
    const wallet = this.getWallet(user);
    try {
      user = await user.save({ session });
      await wallet.save({ session });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return user;
  }

  async updateStatus(
    therapistId: string,
    updateStatusDto: UpdateTherapistStatusDto,
    session: ClientSession,
  ) {
    const user = await this.getUserById(therapistId);

    if (
      !user ||
      (!user.roles.includes(ROLE.THERAPIST) && !user.roles.includes(ROLE.USER))
    ) {
      throw new BadRequestException('Invalid user');
    }

    const statusValue = updateStatusDto.isActive
      ? USER_STATUS.ACTIVE
      : USER_STATUS.INACTIVE;
    user.status = statusValue;

    if (updateStatusDto.isActive) {
      this.eventEmitter.emit(events.THERAPIST_ACTIVATED, {
        therapistName: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
    }

    await user.save({ session });
    return user;
  }

  async activeStatusTherapistFromIds(ids: string[]) {
    const user = await this.userModel
      .find({ _id: { $in: ids }, status: USER_STATUS.ACTIVE, isOnline: true })
      .exec();
    return user;
  }

  async activeStatusAndOfflineTherapistFromIds(ids: string[]) {
    const user = await this.userModel
      .find({ _id: { $in: ids }, status: USER_STATUS.ACTIVE, isOnline: false })
      .exec();
    return user;
  }

  async getAllAdmins() {
    const admins = await this.userModel.find({ roles: ROLE.ADMIN }).exec();
    return admins;
  }

  async getFilteredUsersList(
    filter: FilterQuery<ITherapistProfileDocument>,
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
          from: 'media',
          localField: 'profilePicture',
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
    ];

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
    const docsLength = await this.userProfile.aggregate(totalDocsPipeline);

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

    const therapists = await this.userProfile.aggregate(pipelines);
    const paginateData = await this.getPaginateDataFormTotalDocs(
      totalDocs,
      options.page,
      options.limit,
    );

    const responseUsers = [];

    for (let i = 0; i < therapists.length; i++) {
      const therapist = therapists[i];
      const therapistId = therapist.user._id.toHexString();

      const wallet = await this.walletModel.findOne({ user: therapistId });

      therapist.wallet = wallet;

      let paidMinutes = 0;
      let freeTrialMinutes = 0;

      if (wallet) {
        const CALL_CHARGE_PER_MINUTE =
          await this.systemConfigRepository.getCallChargePerMinute();

        paidMinutes = Number(
          (wallet.mainBalance / CALL_CHARGE_PER_MINUTE).toFixed(2),
        );
        freeTrialMinutes = Number(wallet.freeTrialMinutes.toFixed(2));
      }

      therapist.paidMinutes = paidMinutes;
      therapist.freeTrialMinutes = freeTrialMinutes;

      await responseUsers.push(therapist);
    }

    const responseData = {
      docs: responseUsers,
      ...paginateData,
    };

    return responseData;
  }

  async getAllTherapist() {
    const therapists = await this.userModel
      .find({ roles: ROLE.THERAPIST, emailVerified: true })
      .exec();
    return therapists;
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

  async newCreateUser(
    newCreateUserDto: NewRegisterUserDto,
    role: ROLE,
    session: ClientSession,
  ) {
    let referralSourceUserId = '';
    let sysGeneratedReferralId = '';
    let isSystemReferral = false;
    let referralCode = null;

    if (await this.userModel.isEmailTaken(newCreateUserDto.email))
      throw new ConflictException('Email already exists');

    if (newCreateUserDto.referralCode) {
      const referralSourceUser = await this.getUserByReferralCode(
        newCreateUserDto.referralCode,
      );

      const systemReferralData = await this.getSysReferralCode(
        newCreateUserDto.referralCode,
      );

      if (!referralSourceUser && !systemReferralData) {
        throw new BadRequestException('Invalid referral code');
      }

      if (referralSourceUser) {
        referralSourceUserId = referralSourceUser._id;
        referralCode = referralSourceUser.referralCode;
      } else {
        sysGeneratedReferralId = systemReferralData._id;
        isSystemReferral = true;
        referralCode = systemReferralData.referralCode;
      }
    }

    let user = new this.userModel({
      ...newCreateUserDto,
      roles: [role],
      status:
        role === ROLE.THERAPIST ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE,
      referralCode: await this.generateReferralCode(REFERRAL_CODE_LENGTH),
    });
    try {
      user = await user.save({ session });

      if (newCreateUserDto.referralCode) {
        await this.saveReferralUsers(
          referralSourceUserId,
          user._id,
          isSystemReferral,
          sysGeneratedReferralId,
          referralCode,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return user;
  }

  async getUserTokenData(userId: string) {
    const tokenData = await this.tokenModel
      .find({ userId: userId, tokenType: TOKEN_TYPE.EMAIL_VERIFICATION })
      .exec();
    return tokenData;
  }

  async deleteUserTokenData(userId: string) {
    const tokenData = await this.tokenModel
      .deleteMany({ userId: userId, tokenType: TOKEN_TYPE.EMAIL_VERIFICATION })
      .exec();
    return tokenData;
  }

  async getCategoryByName(name: string) {
    const category = await this.categoryModel.findOne({ name });
    return category;
  }

  async createDefaultSystemGeneratedReferralCode(
    numOfRecords: number,
    session: ClientSession,
  ) {
    const createdRecords = [];

    for (let i = 0; i < numOfRecords; i++) {
      const referralCode = await this.generateReferralCode(
        REFERRAL_CODE_LENGTH,
      );

      let systemReferralCode = new this.systemReferralCodeModel({
        referralCode,
      });

      systemReferralCode = await systemReferralCode.save({ session });

      createdRecords.push(systemReferralCode);
    }

    return createdRecords;
  }

  async removeUserById(userId: string) {
    const removeUser = await this.userModel.deleteOne({
      _id: userId,
    });
    return removeUser;
  }

  async removeUserProfile(userId: string) {
    const removeUserProfile = await this.userProfile.deleteOne({
      user: userId,
    });
    return removeUserProfile;
  }

  async removeTherapistProfile(userId: string) {
    const removeTherapistProfile = await this.therapistProfile.deleteOne({
      user: userId,
    });
    return removeTherapistProfile;
  }

  async getTherapistsPhoneNumbers(ids: string[]) {
    const therapistProfiles = await this.therapistProfile
      .find({
        user: { $in: ids },
        phoneNumber: { $exists: true },
      })
      .select({ phoneNumber: 1 });

    const phoneNunbers = therapistProfiles.map(
      (profile) => profile.phoneNumber,
    );

    return phoneNunbers;
  }

  async getSysReferralCode(referralCode: string) {
    const systemReferralData = await this.systemReferralCodeModel
      .findOne({ referralCode })
      .exec();
    return systemReferralData;
  }

  async getAllReferralUsers() {
    const pipelines = [
      {
        $group: {
          _id: '$referralCode',
          total: {
            $sum: 1,
          },
          isSystemReferral: {
            $first: '$isSystemReferral',
          },
        },
      },
    ];
    const result = await this.referralModel.aggregate(pipelines);
    return result;
  }

  async rejectTherapist(rejectTherapistDto: TherapistRejectDto) {
    const user = await this.getUserById(rejectTherapistDto.therapistId);

    if (!user || !user.roles.includes(ROLE.THERAPIST)) {
      throw new BadRequestException('Invalid user');
    }

    // await this.removeUserWallet(rejectTherapistDto.therapistId);

    // await this.removeTherapistProfile(rejectTherapistDto.therapistId);

    // await this.removeUserById(rejectTherapistDto.therapistId);

    //update user status
    const updatedUser = await this.userModel.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        status: USER_STATUS.REJECT,
        rejectReason: rejectTherapistDto.rejectReason,
      },
      {
        new: true,
      },
    );

    this.eventEmitter.emit(events.THERAPIST_REJECTED, {
      therapistName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      rejectReason: rejectTherapistDto.rejectReason,
    });

    return user;
  }

  async removeUserWallet(userId: string) {
    const removeUserWallet = await this.walletModel.deleteOne({
      user: userId,
    });
    return removeUserWallet;
  }

  async generateTOTP(user: IUserDocument) {
    let response = null;
    const isAlreadyGenerated = await this.twoFactorAuthModel.findOne({
      userId: user._id,
    });

    if (isAlreadyGenerated) {
      response = isAlreadyGenerated;
    } else {
      const secret = speakeasy.generateSecret();
      const secretData = new this.twoFactorAuthModel({
        userId: user._id,
        secret,
      });
      await secretData.save();
      response = secretData;
    }

    return response;
  }

  async verifyTOTP(user: IUserDocument, token: string) {
    const get2FAData = await this.twoFactorAuthModel.findOne({
      userId: user._id,
    });

    if (!get2FAData) {
      throw new BadRequestException('Please generate 2FA code first.');
    }

    const secret = get2FAData.secret.base32;
    const verified = await speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      await this.userModel.findOneAndUpdate(
        { _id: user._id },
        { isTwoStepVerified: true },
      );
      return { verified: true };
    } else {
      return { verified: false };
    }
  }

  async createSourceGeneratedReferralCode(
    sourceGeneratedReferralDto: SourceGeneratedReferralDto,
    session: ClientSession,
  ) {
    const isAlreadyGenerated = await this.isReferralCodeExists(
      sourceGeneratedReferralDto.referralCode,
    );
    if (isAlreadyGenerated) {
      throw new BadRequestException('Referral code already exist.');
    }
    const sourceGeneratedReferral = new this.systemReferralCodeModel({
      referralCode: sourceGeneratedReferralDto.referralCode,
      source: sourceGeneratedReferralDto.source,
    });

    return await sourceGeneratedReferral.save({
      session,
    });
  }

  async getSystemGeneratedReferralCode() {
    const sourceGeneratedReferral = await this.systemReferralCodeModel.find();

    return sourceGeneratedReferral;
  }

  async closeAccount(userId: string) {
    try {
      const userDetails = await this.getUserById(userId);
      if (userDetails && userDetails.roles.includes(ROLE.USER)) {
        await this.closeUserProfile(userId);
      } else {
        await this.closeTherapistProfile(userId);
      }

      const user = await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { status: USER_STATUS.CLOSED } },
        { new: true },
      );
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async closeTherapistProfile(userId: string) {
    try {
      const mediaIds = [];
      const therapistProfile = await this.getTherapistDetails(userId);
      if (
        therapistProfile &&
        therapistProfile[0].profilePicture &&
        therapistProfile[0].profilePicture.filepath
      ) {
        await mediaIds.push(therapistProfile[0].profilePicture._id);
        fs.unlinkSync(therapistProfile[0].profilePicture.filepath);
      }

      if (
        therapistProfile &&
        therapistProfile[0].medias &&
        therapistProfile[0].medias.length > 0
      ) {
        for (let i = 0; i < therapistProfile[0].medias.length; i++) {
          await mediaIds.push(therapistProfile[0].medias[i]._id);
          fs.unlinkSync(therapistProfile[0].medias[i].filepath);
        }
      }
      const updatedTherapist = await this.therapistProfile.findOneAndUpdate(
        { user: userId },
        { $set: { profilePicture: null, medias: [] } },
        { new: true },
      );
      const medias = await this.mediaModel.find({ _id: mediaIds });
      console.log('medias:', medias);
      const deletedMedias = await this.mediaModel.deleteMany({ _id: mediaIds });
      console.log('deletedMedias', deletedMedias);

      return updatedTherapist;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async closeUserProfile(userId: string) {
    try {
      const userProfile = await this.getUserDetails(userId);
      if (
        userProfile &&
        userProfile[0].profilePicture &&
        userProfile[0].profilePicture.filepath
      ) {
        const mediaId = userProfile[0].profilePicture._id;
        fs.unlinkSync(userProfile[0].profilePicture.filepath);
        const medias = await this.mediaModel.find({ _id: mediaId });
        console.log('medias:', medias);
        const deletedMedias = await this.mediaModel.deleteOne({
          _id: mediaId,
        });
        console.log('deletedMedias', deletedMedias);
      }

      const updatedUserProfile = await this.userProfile.findOneAndUpdate(
        { user: userId },
        { $set: { profilePicture: null } },
        { new: true },
      );

      return updatedUserProfile;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async checkIsUserReferToTherapist(userId: string, therapistId: string) {
    const referral = await this.referralModel.findOne({
      referralRecipientUserId: userId,
      referralSourceUserId: therapistId,
    });

    return referral;
  }

  async updateAllUserStatus(userId: string, status: string) {
    try {
      const userDetails = await this.getUserById(userId);

      const user = await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { status: status } },
        { new: true },
      );
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

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

  async getAllTherapistIds() {
    const therapists = await this.userModel
      .find({ roles: ROLE.THERAPIST })
      .exec();

    const ids = therapists.map((therapist) => therapist._id.toHexString());

    return ids;
  }

  async multiUserCloseAccount(emails: string[]) {
    try {
      const closedUser = [];

      for (let i = 0; i < emails.length; i++) {
        const userEmail = emails[i];

        const userDetails = await this.getUserByEmail(userEmail);

        if (userDetails && userDetails.roles.includes(ROLE.USER)) {
          const userId = userDetails._id;
          await this.closeUserProfile(userId);

          const uniqueEmail = await this.getUniqueEmailForCloseAccount(
            userDetails.email,
          );

          const user = await this.userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { status: USER_STATUS.CLOSED, email: uniqueEmail } },
            { new: true },
          );

          await closedUser.push(user);
        }
      }

      return closedUser;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getUniqueEmailForCloseAccount(email) {
    let uniqueEmail = '';

    for (let i = 0; i >= 0; i++) {
      const emailPrefix = `d-email-${i}-`;
      const checkEmail = `${emailPrefix}${email}`;
      const isEmailExist = await this.getUserByEmail(checkEmail);

      if (!isEmailExist) {
        uniqueEmail = checkEmail;
        break;
      }
    }

    return uniqueEmail;
  }
}
