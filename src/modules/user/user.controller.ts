import { Roles } from '@decorators/role.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
  NotFoundException,
  HttpCode,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import mongoose, { Connection, FilterQuery, Types } from 'mongoose';
import { ROLE, THERAPIST_LIST_TAB_TYPE, USER_STATUS } from '@enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { RolesGuard } from '@classes/role.guard';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetQueryDto } from '@dto/getQuery.dto';
import { DEFAULT_PAGE, DEFAULT_SORT, LIMIT_PER_PAGE } from '@constants/index';
import {
  IRequest,
  ITherapistProfileDocument,
  IUserDocument,
} from '@interfaces';
import { UpdateTherapistProfileDto } from './dto/update-profile.dto';
import * as path from 'path';
import { MediaService } from '@modules/media/media.service';
import { UpdateTherapistDto } from './dto/update-therapist.dto';
import { AvailabilityService } from '@modules/availability/availability.service';
import { GetTherapistListDto } from './dto/get-therapist-list.dto';
import { ShortlistedTherapistService } from '@modules/shortlistedTherapists/shortlistedTherapist.service';
import { UpdateTherapistStatusDto } from './dto/update-status.dto';
import { GetUserListDto } from './dto/get-user-list.dto';
import { UserIdDto } from './dto/user-id.dto';
import { SysGeneratedReferralDto } from './dto/sys-generated-referral.gto';
import * as moment from 'moment';
import { TherapistRejectDto } from './dto/therapist-reject.dto';
import { SourceGeneratedReferralDto } from './dto/source-generated-refferal.dto';
import { CloseAccountDto } from './dto/close-account.dto';
import { SessionService } from '@modules/session/session.service';
import { MultiUserCloseAccountDto } from './dto/multi-user-close-account';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private userService: UserService,
    private readonly mediaService: MediaService,
    private readonly availabilityService: AvailabilityService,
    private readonly shortlistedTherapistService: ShortlistedTherapistService,
    private readonly sessionService: SessionService,
  ) {}

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/')
  @ApiOperation({
    description: 'Create a new user',
  })
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const newUser: any = await this.userService.createUser(
        createUserDto,
        ROLE.USER,
        session,
      );

      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send(newUser);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN, ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/user')
  @ApiOperation({
    description: 'Get all users',
  })
  async getAllUsers(@Query() query: GetUserListDto) {
    const { limit, page, sort, q, categories, status } = query;
    let { startDate, endDate } = query;

    const IS_ONLINE_SORT = 'user.isOnline: desc';

    const options: any = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? `${IS_ONLINE_SORT},${sort}` : IS_ONLINE_SORT,
    };

    const filteredCategories = categories;

    if (!startDate || !endDate) {
      startDate = new Date('2024-05-03');
      endDate = new Date();
    }

    let filter: FilterQuery<IUserDocument>;
    if (status) {
      filter = {
        ...filter,
        'user.status': status,
      };
    } else {
      filter = {
        ...filter,
        'user.status': { $nin: [USER_STATUS.CLOSED] },
      };
    }

    if (q) {
      filter = {
        ...filter,
        $or: [
          { 'user.email': { $regex: q, $options: 'i' } },
          { 'user.firstName': { $regex: q, $options: 'i' } },
          { 'user.lastName': { $regex: q, $options: 'i' } },
        ],
      };
    }

    if (filteredCategories && filteredCategories.length > 0) {
      filter = {
        ...filter,
        'categories.name': { $in: filteredCategories },
        // 'categories.name': { $all: categories }, // for match all elements into array
      };
    }

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }

    if (startDate && endDate) {
      filter = {
        ...filter,
        'user.createdAt': {
          $gte: moment(startDate).startOf('day').toDate(),
          $lte: moment(endDate).endOf('day').toDate(),
        },
      };
    }

    filter = {
      ...filter,
      'user.roles': ROLE.USER,
    };

    const users = await this.userService.getFilteredUsersList(filter, options);
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/profile')
  @ApiOperation({
    description: 'Get user profile',
  })
  async getUserProfile(@Req() req: IRequest) {
    if (req.user.role === ROLE.THERAPIST) {
      return this.userService.getTherapistDetails(req.user._id);
    }
    return this.userService.getUserDetails(req.user._id);
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/user-profile')
  @ApiOperation({
    description: 'Get user profile by id.',
  })
  async getUserProfileById(@Body() body: UserIdDto) {
    try {
      const user = await this.userService.getUserById(body.userId);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.roles.includes(ROLE.THERAPIST)) {
        return this.userService.getTherapistDetails(body.userId);
      }

      return this.userService.getUserDetails(body.userId);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update-profile')
  @ApiOperation({ description: 'Update profile of logged in user' })
  async updateProfile(
    @Body() body: UpdateTherapistProfileDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      let userId = req.user._id;
      let updateRole = req.user.role;

      if (req.user.role === ROLE.ADMIN) {
        if (!body.userId) {
          throw new BadRequestException('userId field is required.');
        }

        userId = body.userId;

        const user = await this.userService.getUserById(userId);

        if (!user) {
          throw new BadRequestException('user does not exists.');
        }

        updateRole = user.roles[0];
      }

      let updatedUser: any = null;

      if (updateRole == ROLE.USER) {
        console.log('user update ');
        updatedUser = await this.userService.updateUser(userId, body, session);
      } else {
        console.log('therapist update');
        updatedUser = await this.userService.updateTherapist(
          userId,
          body,
          session,
        );

        if (body.therapistAvailability) {
          await this.availabilityService.createAvailability(
            req.user,
            body.therapistAvailability,
          );
        }
      }

      await session.commitTransaction();

      return res.status(HttpStatus.OK).send({ updatedUser });
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  // @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('/admin')
  @ApiOperation({
    description: 'Get all admin users',
  })
  async getAllAdmins(@Query() query: GetQueryDto) {
    const { limit, page, sort, q } = query;
    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
    };

    let filter: FilterQuery<IUserDocument>;
    if (q) {
      filter = {
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
        ],
      };
    }

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    const admins = await this.userService.getAllUserByRole(filter, options);
    return admins;
  }

  // @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('/status/:id')
  @ApiOperation({
    description: 'Update status of the therapist',
  })
  async changeStatus(
    @Param('id') id: string,
    @Body() updateUserDto: ChangeStatusDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updatedTherapist = await this.userService.updateAllUserStatus(
        id,
        updateUserDto.status,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(updatedTherapist);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  //FIXME: access control
  @UseGuards(JwtAuthGuard)
  @Get('/therapist/:therapistId')
  @ApiOperation({
    description: 'Get therapist details',
  })
  async getTherapistDetails(@Param('therapistId') therapistId: string) {
    return this.userService.getTherapistDetails(therapistId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/deactivate-account')
  @ApiOperation({
    description: 'Deactivate user account',
  })
  async deactivateAccount(@Req() req: IRequest, @Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updatedUser = await this.userService.updateUser(
        req.user._id.toHexString(),
        { status: USER_STATUS.INACTIVE },
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(updatedUser);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Get('/profile-image/:userId')
  @ApiOperation({
    description: 'Get user profile image',
  })
  async getProfileImage(@Param('userId') userId: string, @Res() res: Response) {
    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileImage: string | Types.ObjectId;

    try {
      if (user.roles.includes(ROLE.THERAPIST)) {
        const therapistProfile = await this.userService.getProfile(
          userId,
          ROLE.THERAPIST,
        );
        profileImage = therapistProfile.profilePicture;
      } else {
        const userProfile = await this.userService.getProfile(
          userId,
          ROLE.USER,
        );
        profileImage = userProfile.profilePicture;
      }
    } catch (error) {
      throw new NotFoundException('Profile image not found');
    }

    if (!profileImage) {
      throw new NotFoundException('Profile image not found');
    }

    const media = await this.mediaService.getMediaById(
      typeof profileImage === 'string'
        ? profileImage
        : profileImage.toHexString(),
    );
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const rootPath = process.cwd();
    return res
      .status(HttpStatus.OK)
      .sendFile(path.join(rootPath, media.filepath));
  }

  @Roles(ROLE.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/therapists')
  @ApiOperation({
    description: 'Get therapists',
  })
  async getTherapists() {
    const users = await this.userService.getTherapistsList();
    return users;
  }

  @Roles(ROLE.USER, ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/therapists-filter')
  @ApiOperation({
    description: 'Get therapists filtered',
  })
  async getFilteredTherapistsList(
    @Query() query: GetTherapistListDto,
    @Req() req: IRequest,
  ) {
    const {
      sort,
      q,
      therapistListTabType,
      categories,
      status,
      startDate,
      endDate,
    } = query;
    let filteredCategories = categories;

    const IS_ONLINE_SORT = 'user.isOnline: desc';

    const options = {
      sort: sort ? `${IS_ONLINE_SORT},${sort}` : IS_ONLINE_SORT,
    };

    let filter: FilterQuery<ITherapistProfileDocument>;

    const shortlistedTherapists =
      await this.shortlistedTherapistService.getShortlistedTherapists(
        req.user._id,
      );

    const shortListedIdsStr = shortlistedTherapists.map((shortlist) =>
      shortlist.therapistId.toHexString(),
    );

    const shortListedIds = shortlistedTherapists.map((shortlist) => {
      const _id = new mongoose.Types.ObjectId(shortlist.therapistId);
      return _id;
    });

    if (therapistListTabType == THERAPIST_LIST_TAB_TYPE.RECOMMENDED) {
      const userCategories = await this.userService.getUserCategories(
        req.user._id,
      );

      if (userCategories.length > 0) {
        filteredCategories = userCategories.concat(filteredCategories);

        const uniqueSet = new Set(filteredCategories);

        // Convert Set back to an array
        filteredCategories = Array.from(uniqueSet);
      }
    } else if (therapistListTabType == THERAPIST_LIST_TAB_TYPE.SHORTLISTED) {
      filter = {
        ...filter,
        'user._id': { $in: shortListedIds },
      };
    }

    if (status) {
      filter = {
        ...filter,
        'user.status': status,
      };
    } else {
      filter = {
        ...filter,
        'user.status': { $nin: [USER_STATUS.CLOSED] },
      };
    }

    if (q) {
      filter = {
        ...filter,
        $or: [
          { 'user.email': { $regex: q, $options: 'i' } },
          { 'user.firstName': { $regex: q, $options: 'i' } },
          { 'user.lastName': { $regex: q, $options: 'i' } },
        ],
      };
    }

    if (filteredCategories && filteredCategories.length > 0) {
      filter = {
        ...filter,
        'categories.name': { $in: filteredCategories },
        // 'categories.name': { $all: categories }, // for match all elements into array
      };
    }

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }

    if (startDate && endDate) {
      filter = {
        ...filter,
        'user.createdAt': {
          $gte: moment(startDate).startOf('day').toDate(),
          $lte: moment(endDate).endOf('day').toDate(),
        },
      };
    }

    const therapists = await this.userService.getFilteredTherapistsList(
      filter,
      options,
    );

    const responseTherapists = [];

    for (let i = 0; i < therapists.length; i++) {
      const therapist = therapists[i];
      const therapistId = therapist.user._id.toHexString();
      const isInclude = shortListedIdsStr.includes(therapistId);

      therapist.isInShortlist = isInclude ? true : false;

      const inSessionTherapistIds =
        await this.sessionService.getInSessionTherapistIds();
      const isTherapistInsession = inSessionTherapistIds.includes(therapistId);

      therapist.isTherapistInsession = isTherapistInsession ? true : false;
      await responseTherapists.push(therapist);
    }

    // therapists = therapists.map((therapist) => {
    //   const therapistId = therapist.user._id.toHexString();
    //   const isInclude = shortListedIdsStr.includes(therapistId);

    //   therapist.isInShortlist = isInclude ? true : false;

    //   // const inSessionTherapistIds =
    //   //   await this.sessionService.getInSessionTherapistIds();
    //   // const isTherapistInsession = inSessionTherapistIds.includes(therapistId);

    //   // therapist.isTherapistInsession = isTherapistInsession ? true : false;
    //   // return therapist;
    // });

    return responseTherapists;
  }

  @Roles(ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/update-therapist-profile')
  @ApiOperation({ description: 'Update therapist profile of logged in user' })
  async updateTherapistProfile(
    @Body() body: UpdateTherapistDto,
    @Req() req: IRequest,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      await this.userService.updateTherapist(req.user._id, body, session);

      await this.availabilityService.createAvailability(
        req.user,
        body.therapistAvailability,
      );

      const therapistProfile = await this.userService.getTherapistDetails(
        req.user._id,
      );

      await session.commitTransaction();

      return therapistProfile;
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/update-status/:id')
  @ApiOperation({
    description: 'Update status of the therapist',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTherapistStatusDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updatedTherapist = await this.userService.updateTherapistStatus(
        id,
        updateStatusDto,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(updatedTherapist);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/generate-referral-code')
  @ApiOperation({
    description: 'System generated referral code.',
  })
  async sysGeneratedReferral(
    @Body() sysGeneratedReferralDto: SysGeneratedReferralDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const sysGeneratedReferral = await this.userService.sysGeneratedReferral(
        sysGeneratedReferralDto.numOfRecords,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(sysGeneratedReferral);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/all-referral-users')
  @ApiOperation({
    description: 'All referral users record.',
  })
  async getAllReferralUsers() {
    try {
      const getAllReferralUsers = await this.userService.getAllReferralUsers();

      return getAllReferralUsers;
    } catch (error) {
      throw error;
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/reject')
  @ApiOperation({
    description: 'Reject therapists applicaion.',
  })
  async rejectTherapist(
    @Body() rejectTherapistDto: TherapistRejectDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const updatedTherapist = await this.userService.rejectTherapist(
        rejectTherapistDto,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(updatedTherapist);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/source-generated-referral-code')
  @ApiOperation({
    description: 'Source generated referral code.',
  })
  async sourceGeneratedReferral(
    @Body() sourceGeneratedReferralDto: SourceGeneratedReferralDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const createSourceGeneratedReferralCode =
        await this.userService.createSourceGeneratedReferralCode(
          sourceGeneratedReferralDto,
          session,
        );

      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(createSourceGeneratedReferralCode);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/get-system-ref-code')
  @ApiOperation({
    description: 'Get system generated referral code.',
  })
  async getSystemGeneratedReferralCode(@Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const referralCodes =
        await this.userService.getSystemGeneratedReferralCode();

      await session.commitTransaction();
      return res.status(HttpStatus.OK).send(referralCodes);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.THERAPIST, ROLE.USER, ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/close-account')
  @ApiOperation({
    description: 'Close user account.',
  })
  async closeAccount(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() body: CloseAccountDto,
  ) {
    try {
      let userId = req.user._id;

      if (req.user.role === ROLE.ADMIN) {
        if (!body.userId) {
          throw new BadRequestException('userId field is required.');
        }

        userId = body.userId;
      }

      const closeAccount = await this.userService.closeAccount(userId);

      return res.status(HttpStatus.OK).send(closeAccount);
    } catch (error) {
      throw error;
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/multi-user-close-account')
  @ApiOperation({
    description: 'Multi user close account.',
  })
  async multiUserCloseAccount(
    @Res() res: Response,
    @Body() body: MultiUserCloseAccountDto,
  ) {
    try {
      const { emails } = body;

      const closeAccount = await this.userService.multiUserCloseAccount(emails);

      return res.status(HttpStatus.OK).send(closeAccount);
    } catch (error) {
      throw error;
    }
  }
}
