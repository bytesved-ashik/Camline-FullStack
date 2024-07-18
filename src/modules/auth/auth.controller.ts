import {
  Controller,
  Post,
  UseGuards,
  Get,
  Body,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  HttpStatus,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { LocalAuthGuard } from '@classes/local-auth.guard';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { IRequest } from '@interfaces';
import { AuthService } from './auth.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UserService } from '@modules/user/user.service';
import { TokenService } from '@modules/token/token.service';
import { SendOTPDto } from '@modules/token/dto/sendOTP.dto';
import { ROLE, TOKEN_TYPE, USER_STATUS } from '@enums';
import { VerifyEmailDto } from '@modules/token/dto/verifyEmail.dto';
import { RegisterUserDto } from '@modules/user/dto/create-user.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterTherapistDto } from '../user/dto/create-therapist.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { ResetPasswordDto } from '@modules/token/dto/resetPassword.dto';
import { AvailabilityService } from '@modules/availability/availability.service';
import { ChangePasswordDto } from './dto/change.password.dto';
import { CreateAdminDto } from '@modules/user/dto/create-admin.dto';
import { NewRegisterUserDto } from '@modules/user/dto/new-create-user.dto';
import { events } from '@events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewVerifyEmailDto } from '@modules/token/dto/newVerifyEmail.dto';
import { AgendaAppService } from '@utils/agenda.service';
import { Roles } from '@decorators/role.decorator';
import { RolesGuard } from '@classes/role.guard';
import { TwoFactorAuthDto } from './dto/twoFactorAuth.dto';
import { ResendVerificationEmailDto } from '@modules/user/dto/resend-verification-email.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private authService: AuthService,
    private userService: UserService,
    private tokenService: TokenService,
    private availabilityService: AvailabilityService,
    private eventEmitter: EventEmitter2,
    private readonly agendaAppService: AgendaAppService,
  ) {}

  // New API for user register
  @Post('/new-user-register')
  @ApiOperation({
    description: 'User registration',
  })
  async registerNew(
    @Body() newCreateUserDto: NewRegisterUserDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.userService.newCreateUser(
        newCreateUserDto,
        ROLE.USER,
        session,
      );
      const token = await this.authService.createEmailToken(user);

      await this.userService.createEmailTokenData(user, token, session);

      this.eventEmitter.emit(events.USER_REGISTERED, {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        token,
      });

      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // New Api for email verification
  @Post('/new-verify-email')
  @ApiOperation({
    description: 'verify email address using token',
  })
  async verifyEmailByToken(
    @Body() body: NewVerifyEmailDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    const tokenData = await this.tokenService.getToken(body.token);

    if (tokenData === null) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.authService.verifyEmailToken(body.token, session);
    const userId = tokenData.userId.toJSON();
    await this.agendaAppService.removeJobByUserId(userId);

    session.startTransaction();
    try {
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send({ message: 'Email verified' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('/user-register')
  @ApiOperation({
    description: 'User registration',
  })
  async register(@Body() createUserDto: RegisterUserDto, @Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.userService.createUser(
        createUserDto,
        ROLE.USER,
        session,
      );
      // await this.userService.sendVerificationEmail(user, session);

      const token = await this.authService.createEmailToken(user);
      await this.userService.createEmailTokenData(user, token, session);
      // await this.agendaAppService.removeUserDataJob(user._id);

      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('/new-therapist-register')
  @ApiOperation({
    description: 'Therapist registration',
  })
  async newRegisterTherapist(
    @Body() @Body() newCreateUserDto: NewRegisterUserDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.userService.newCreateUser(
        newCreateUserDto,
        ROLE.THERAPIST,
        session,
      );
      const VATnumber = newCreateUserDto.VATnumber;
      const token = await this.authService.createEmailToken(user);

      await this.userService.createEmailTokenData(
        user,
        token,
        session,
        VATnumber,
      );

      this.eventEmitter.emit(events.USER_REGISTERED, {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        token,
      });

      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Post('/therapist-register')
  @ApiOperation({
    description: 'Therapist registration',
  })
  async registerTherapist(
    @Body() createUserDto: RegisterTherapistDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.userService.createTherapist(
        createUserDto,
        session,
      );

      const token = await this.authService.createEmailToken(user);
      await this.userService.createEmailTokenData(user, token, session);

      await this.availabilityService.defaultAvailability(user);
      // await this.agendaAppService.removeUserDataJob(user._id);

      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    description: 'Login for users',
  })
  @Post('/login')
  async login(@Req() req: IRequest, @Body() body: LoginDto) {
    if (body.role && !req.user.roles.includes(body.role)) {
      throw new UnauthorizedException({
        message: 'You are unauthorized as your requested role.',
      });
    }

    if (req.user.emailVerified == false) {
      throw new UnauthorizedException({
        message: 'Please verify your mail id.',
      });
    }

    const allowedStatuses = [USER_STATUS.ACTIVE, USER_STATUS.REJECT];

    if (!allowedStatuses.includes(req.user.status)) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: `Your account status is ${req.user.status}. Please contact admin.`,
      });
    }

    return this.authService.login(req.user, body.role);
  }

  @Post('/forgot-password')
  @ApiOperation({
    description: 'send reset password link to user email',
  })
  async forgotPassword(@Body() body: SendOTPDto) {
    const user = await this.userService.getUserByEmail(body.email);

    if (!user) {
      return {
        message:
          'If you have registered with this email, you will receive an email with OTP to reset your password.',
      };
    }

    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      await this.userService.sendPasswordResetEmail(body.email, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return {
      message:
        'If you have registered with this email, you will receive an email with OTP to reset your password.',
    };
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    const session = await this.mongoConnection.startSession();
    const user = await this.userService.getUserByEmail(body.email);

    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }

    const token = await this.tokenService.getUserVerificationToken(
      user.id,
      TOKEN_TYPE.PASSWORD_RESET,
    );

    if (!token || token.token !== body.token) {
      throw new UnauthorizedException({ message: 'Invalid token' });
    }

    session.startTransaction();
    try {
      await this.userService.changePassword(
        user.id,
        {
          newPassword: body.password,
        },
        session,
      );
      await this.tokenService.deleteToken(token.id, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return { message: 'Password changed' };
  }

  @Post('/send-verification-email')
  @ApiOperation({
    description: 'send verification email to user for email verification',
  })
  async sendVerificationEmail(@Body() body: SendOTPDto) {
    const user = await this.userService.getUserByEmail(body.email);

    if (!user) {
      return {
        message:
          'If you have registered with this email, you will receive an email with a verification link.',
      };
    }

    if (user.emailVerified) {
      throw new ConflictException({ message: 'Email already verified' });
    }

    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      await this.userService.sendVerificationEmail(user, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return {
      message:
        'If you have registered with this email, you will receive an email with a verification link.',
    };
  }

  @Post('/verify-email')
  @ApiOperation({
    description: 'verify email address',
  })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const session = await this.mongoConnection.startSession();
    const user = await this.userService.getUserByEmail(body.email);

    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }

    const token = await this.tokenService.getUserVerificationToken(
      user.id,
      TOKEN_TYPE.EMAIL_VERIFICATION,
    );

    if (!token || token.token !== body.token) {
      throw new UnauthorizedException({ message: 'Invalid token' });
    }

    session.startTransaction();
    try {
      await this.userService.verifyEmail(user.id, session);

      if (
        user.roles.includes(ROLE.THERAPIST) &&
        user.status == USER_STATUS.PENDING
      ) {
        await this.userService.activeUser(user.id, session);
      }

      await this.tokenService.deleteToken(token.id, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return { message: 'Email verified' };
  }

  @Post('/refresh-token')
  @ApiOperation({
    description: 'refresh access token for user every time token is expired',
  })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  @ApiOperation({
    description: 'Get Profile of logged in user',
  })
  getProfile(@Req() req: IRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/change-password')
  @ApiOperation({
    description: 'Change password',
  })
  async changePassword(
    @Req() req: IRequest,
    @Res() res: Response,
    @Body() dto: ChangePasswordDto,
  ) {
    const session = await this.mongoConnection.startSession();
    await session.startTransaction();
    try {
      await this.userService.changePassword(
        req.user._id.toHexString(),
        { oldPassword: dto.oldPassword, newPassword: dto.newPassword },
        session,
      );

      await session.commitTransaction();
      return res.status(HttpStatus.OK).send({ message: 'Password changed' });
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      await session.endSession();
    }
  }

  @Post('/admin-register')
  @ApiOperation({
    description: 'Create an admin user.',
  })
  async adminRegister(
    @Body() createAdminDto: CreateAdminDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.userService.createAdmin(createAdminDto, session);
      // await this.userService.sendVerificationEmail(user, session);
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/two-step-verification')
  @ApiOperation({
    description: 'Generate OTP for two step verification.',
  })
  async generateTwoStepVerificationSendEmail(
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();

    const user = await this.userService.getUserById(req.user._id);
    await this.userService.generateTwoStepVerificationOtp(user, session);

    session.startTransaction();
    try {
      await session.commitTransaction();
      return res
        .status(HttpStatus.OK)
        .send({ message: 'Two step verification completed.' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/register-2FA')
  @ApiOperation({
    description: 'Generate base32 code for 2FA.',
  })
  async generateTwoStepVerification(
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();

    const user = await this.userService.getUserById(req.user._id);
    const secretData = await this.userService.generateTOTP(user);

    session.startTransaction();
    try {
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send({ secretData });
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/verify-2FA')
  @ApiOperation({
    description: 'Verify base32 code for 2FA.',
  })
  async verifyTwoStepVerification(
    @Body() body: TwoFactorAuthDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();

    const user = await this.userService.getUserById(req.user._id);
    const response = await this.userService.verifyTOTP(user, body.token);

    session.startTransaction();
    try {
      await session.commitTransaction();
      return res.status(HttpStatus.OK).send({ response });
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/resend-verification-email')
  @ApiOperation({
    description: 'Resend verification email to user for email verification',
  })
  async resendVerificationEmail(
    @Req() req: IRequest,
    @Body() body: ResendVerificationEmailDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      let userId = req.user._id;

      if (req.user.role == ROLE.ADMIN) {
        userId = body.userId;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new BadRequestException({ message: 'User not found.' });
      }

      if (user.emailVerified) {
        throw new BadRequestException({ message: 'Email already verified' });
      }

      const token = await this.authService.createEmailToken(user);
      await this.userService.createEmailTokenData(user, token, session);

      await session.commitTransaction();

      return res.status(HttpStatus.OK).send({
        message: 'Email verification link has been sent to your email',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
