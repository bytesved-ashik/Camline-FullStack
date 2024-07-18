import {
  Controller,
  Get,
  Req,
  UseGuards,
  Query,
  BadRequestException,
  Body,
  Post,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { GetQueryDto, PaginateQueryDto } from '@dto/getQuery.dto';
import {
  LIMIT_PER_PAGE,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  SESSION_CONSTANT,
  WALLET_CONSTANT,
} from '@constants';
import { IRequest, ITransactionDocument } from '@interfaces';
import { RolesGuard } from '@classes/role.guard';
import { Roles } from '@decorators/role.decorator';
import { ROLE, TRANSACTION_TYPE } from 'src/types/enums';
import { Connection, FilterQuery } from 'mongoose';
import { UpdateOnCallDto } from './dto/update-on-call.dto';
import { CallHistoryService } from '@modules/callHistory/call-history.service';
import { UserService } from '@modules/user/user.service';
import { InjectConnection } from '@nestjs/mongoose';
import { WithdrawWalletBalanceDto } from './dto/withdraw-balance.dto';
import { AgendaAppService } from '@utils/agenda.service';
import * as moment from 'moment';
import { SystemConfigRepository } from '@repositories/systemConfig.repository';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private readonly callHistoryService: CallHistoryService,
    private readonly userService: UserService,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly agendaAppService: AgendaAppService,
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/balance')
  @ApiOperation({
    description: 'Get current wallet details of the user',
  })
  async getBalance(@Req() req: IRequest) {
    if (req.user.roles.includes(ROLE.ADMIN)) {
      return {
        _id: '6597ae28d2d9e82afa324a86',
        mainBalance: 0,
        bonusBalance: 0,
        holdedMainBalance: 0,
        holdedBonusBalance: 0,
        user: req.user._id.toHexString(),
        freeTrialMinutes: 0,
        holdedTrialMinutes: 0,
        createdAt: '2024-01-05T07:22:16.910Z',
        updatedAt: '2024-01-11T08:17:51.765Z',
        id: '6597ae28d2d9e82afa324a86',
      };
    }

    return this.walletService.getBalance(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/transactions')
  @ApiOperation({
    description: 'Get transactions of the user',
  })
  async getTransactions(
    @Req() request: IRequest,
    @Query() query: PaginateQueryDto,
  ) {
    const { limit, page, sort } = query;
    const filter: FilterQuery<ITransactionDocument> = {
      $or: [
        {
          $and: [
            { user: request.user._id },
            {
              type: {
                $in: [TRANSACTION_TYPE.TOPUP, TRANSACTION_TYPE.WITHDRAW],
              },
            },
          ],
        },
        {
          $and: [
            { therapist: request.user._id },
            {
              type: {
                $in: [TRANSACTION_TYPE.TOPUP, TRANSACTION_TYPE.WITHDRAW],
              },
            },
          ],
        },
      ],
    };
    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
    };

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    return this.walletService.getTransactions(filter, options);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ description: 'Get commission transactions' })
  @Get('/commission-transactions')
  async getCommissionTransactions(@Query() query: PaginateQueryDto) {
    const { limit, page, sort } = query;
    const filter: FilterQuery<ITransactionDocument> = {
      type: TRANSACTION_TYPE.COMMISSION_DEDUCTION,
    };
    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
      populate: 'user therapist',
    };

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    return this.walletService.getTransactions(filter, options);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.USER)
  @Post('/update-on-call')
  @ApiOperation({
    description: 'Update users wallet',
  })
  async updateWalletOnCall(
    @Req() req: IRequest,
    @Body() body: UpdateOnCallDto,
  ) {
    try {
      const { callMinutes, therapistId } = body;
      const user = req.user;
      const wallet = await this.walletService.getWalletByUserId(user._id);
      let remainingFreeTrialMinutes = 0;
      let deductAmount = 0;
      let chargeMinutes = callMinutes;

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      // check therapist exists or not
      const therapist = await this.userService.getUserById(therapistId);

      if (!therapist || !therapist.roles.includes(ROLE.THERAPIST)) {
        throw new BadRequestException('Therapist not found');
      }

      if (wallet.freeTrialMinutes) {
        if (callMinutes <= wallet.freeTrialMinutes) {
          remainingFreeTrialMinutes = wallet.freeTrialMinutes - callMinutes;
          chargeMinutes = 0;
        } else {
          chargeMinutes = callMinutes - wallet.freeTrialMinutes;
        }
      }

      if (chargeMinutes > 0) {
        const CALL_CHARGE_PER_MINUTE =
          await this.systemConfigRepository.getCallChargePerMinute();
        deductAmount = chargeMinutes * CALL_CHARGE_PER_MINUTE;
      }

      const updatedWallet = await this.walletService.updateWalletOnCall(
        user._id,
        deductAmount,
        remainingFreeTrialMinutes,
      );

      await this.callHistoryService.createCallHistory({
        userId: user._id,
        callMinutes: callMinutes,
        therapistId: therapist._id,
        previosWallet: wallet,
        currentWallet: updatedWallet,
      });

      return updatedWallet;
    } catch (error) {
      console.log('Error:WalletController:updateWallet : ', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Post('/withdraw-balance')
  @ApiOperation({
    description: 'Withdraw therapist wallet balance',
  })
  async withdrawWalletBalance(
    @Req() req: IRequest,
    @Body() body: WithdrawWalletBalanceDto,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const amount = body.amount;
      const user = req.user;
      const tld = null;
      const today = moment();

      if (today.day() !== WALLET_CONSTANT.WITHDRAW_REQUEST_DAY) {
        throw new BadRequestException(
          'Please send withdrawal requests only on Friday.',
        );
      }

      const wallet = await this.walletService.getWalletByUserId(user._id);

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.withdrawalBalance < amount) {
        throw new BadRequestException(
          'Your wallet withdrawal balance is to low.',
        );
      }

      const withdrawWalletBalance =
        await this.walletService.withdrawWalletBalance(
          user.id,
          amount,
          tld,
          session,
        );
      await session.commitTransaction();
      return withdrawWalletBalance;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.THERAPIST)
  @Get('/withdraw-transactions')
  @ApiOperation({
    description: 'Get withdraw transactions of the therapist',
  })
  async getWithdrawTransactions(
    @Req() request: IRequest,
    @Query() query: PaginateQueryDto,
  ) {
    const { limit, page, sort } = query;
    const filter: FilterQuery<ITransactionDocument> = {
      $or: [
        {
          $and: [
            { user: request.user._id },
            {
              type: {
                $in: [TRANSACTION_TYPE.WITHDRAW],
              },
            },
          ],
        },
        {
          $and: [
            { therapist: request.user._id },
            {
              type: {
                $in: [TRANSACTION_TYPE.WITHDRAW],
              },
            },
          ],
        },
      ],
    };
    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
    };

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    return this.walletService.getTransactions(filter, options);
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ description: 'Get top up transactions' })
  @Get('/topup-transactions')
  async getTopupTransactions(@Query() query: GetQueryDto) {
    const { limit, page, sort, startDate, endDate } = query;

    let filter: FilterQuery<ITransactionDocument> = {
      type: TRANSACTION_TYPE.TOPUP,
    };

    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
      populate: 'user therapist',
    };

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
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    return this.walletService.getTransactions(filter, options);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get('/create-agenda-job')
  @ApiOperation({
    description: 'All therapist weekly wallet balance slip.',
  })
  async agenda() {
    try {
      this.agendaAppService.weeklyCalculatedWithdrawalAmountJob();
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get('/all-weekly-withdrawal-requests')
  @ApiOperation({
    description: 'All weekly withdrawal requests.',
  })
  async allWeeklyWithdrawalRequests() {
    try {
      const allWeeklyWithdrawalRequests =
        await this.walletService.allWeeklyWithdrawalRequests();
      return allWeeklyWithdrawalRequests;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/check-topup')
  @ApiOperation({
    description: 'Check users topUps.',
  })
  async hasTopUpTransactionSpecificAmount(@Req() request: IRequest) {
    try {
      const userId = request.user._id;
      const amount = WALLET_CONSTANT.CHECK_TOPUP_AMOUNT;

      const checkTopup =
        await this.walletService.hasTopUpTransactionSpecificAmount(
          userId,
          amount,
        );
      return { checkTopUpResult: checkTopup };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Post('/reset-all-therapists')
  @ApiOperation({
    description: 'Reset all therapists wallet.',
  })
  async resetAllTherapistsWallet() {
    try {
      const wallets = await this.walletService.resetAllTherapistsWallet();
      return wallets;
    } catch (error) {
      throw error;
    }
  }
}
