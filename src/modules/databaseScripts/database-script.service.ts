// delete-all.service.ts
import { SESSION_CONSTANT } from '@constants/index';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from 'src/types/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DatabaseScriptService {
  constructor(
    // @InjectModel('Appointment') private readonly appointmentModel: Model<any>,
    @InjectModel('Availability') private readonly availabilityModel: Model<any>,
    @InjectModel('Blog') private readonly blogModel: Model<any>,

    @InjectModel('CallHistory') private readonly callHistoryModel: Model<any>,

    @InjectModel('Chat') private readonly chatModel: Model<any>,
    @InjectModel('Media') private readonly mediaModel: Model<any>,

    @InjectModel('Message') private readonly messageModel: Model<any>,
    @InjectModel('Notes') private readonly notesModel: Model<any>,

    @InjectModel('SessionRequest')
    private readonly SessionRequestsModel: Model<any>,

    @InjectModel('Session') private readonly sessionModel: Model<any>,
    @InjectModel('ShortlistedTherapists')
    private readonly shortlistedTherapists: Model<any>,

    @InjectModel('TherapistProfile')
    private readonly therapistProfileModel: Model<any>,
    @InjectModel('Subscriptions')
    private readonly subscriptionsModel: Model<any>,

    @InjectModel('Token') private readonly tokenModel: Model<any>,
    @InjectModel('Transaction') private readonly transactionModel: Model<any>,

    @InjectModel('UserProfile') private readonly userProfileModel: Model<any>,
    @InjectModel('Referral') private readonly userReferralModel: Model<any>,

    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Wallet') private readonly walletModel: Model<any>,
  ) {}

  // async deleteAllRecords() {
  //   const response = [];

  //   const appointmentModel = await this.appointmentModel.deleteMany({}).exec();
  //   const availabilityModel = await this.availabilityModel
  //     .deleteMany({})
  //     .exec();
  //   const blogModel = await this.blogModel.deleteMany({}).exec();

  //   const callHistoryModel = await this.callHistoryModel.deleteMany({}).exec();

  //   const chatModel = await this.chatModel.deleteMany({}).exec();
  //   const mediaModel = await this.mediaModel.deleteMany({}).exec();

  //   const messageModel = await this.messageModel.deleteMany({}).exec();
  //   const notesModel = await this.notesModel.deleteMany({}).exec();

  //   const SessionRequestsModel = await this.SessionRequestsModel.deleteMany(
  //     {},
  //   ).exec();

  //   const sessionModel = await this.sessionModel.deleteMany({}).exec();
  //   const shortlistedTherapists = await this.shortlistedTherapists
  //     .deleteMany({})
  //     .exec();

  //   const therapistProfileModel = await this.therapistProfileModel
  //     .deleteMany({})
  //     .exec();

  //   const tokenModel = await this.tokenModel.deleteMany({}).exec();
  //   const transactionModel = await this.transactionModel.deleteMany({}).exec();

  //   const userProfileModel = await this.userProfileModel.deleteMany({}).exec();
  //   const userReferralModel = await this.userReferralModel
  //     .deleteMany({})
  //     .exec();

  //   const userModel = await this.userModel.deleteMany({}).exec();

  //   const walletModel = await this.walletModel.deleteMany({}).exec();

  //   const subscriptionsModel = await this.subscriptionsModel
  //     .deleteMany({})
  //     .exec();

  //   response.push(
  //     { appointmentModel: appointmentModel },
  //     { availabilityModel: availabilityModel },
  //     { blogModel: blogModel },
  //     { callHistoryModel: callHistoryModel },
  //     { chatModel: chatModel },
  //     { mediaModel: mediaModel },
  //     { messageModel: messageModel },
  //     { notesModel: notesModel },
  //     { SessionRequestsModel: SessionRequestsModel },
  //     { sessionModel: sessionModel },
  //     { shortlistedTherapists: shortlistedTherapists },
  //     { subscriptionsModel: subscriptionsModel },
  //     { therapistProfileModel: therapistProfileModel },
  //     { tokenModel: tokenModel },
  //     { transactionModel: transactionModel },
  //     { userProfileModel: userProfileModel },
  //     { userModel: userModel },
  //     { userReferralModel: userReferralModel },
  //     { walletModel: walletModel },
  //   );

  //   return response;
  // }

  async removeAllFreeMinutes() {
    const walletModel = await this.walletModel.updateMany(
      {},
      {
        freeTrialMinutes: 0,
      },
    );

    return walletModel;
  }

  async addBalanceToUser(userId: string, amount: number) {
    const availableVATCharge =
      (amount * SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE) / 100;

    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          mainBalance: amount,
          availableVATCharge: availableVATCharge,
        },
      },
      { new: true },
    );

    const transaction = await this.transactionModel.create({
      user: new Types.ObjectId(userId),
      therapist: null,
      type: TRANSACTION_TYPE.TOPUP,
      status: TRANSACTION_STATUS.SUCCESS,
      amount,
      tid: uuidv4(),
      remarks: `Account topped up with ${amount}£ as test top up.`,
      availableVATCharge,
    });

    return wallet;
  }

  async verifyEmail(userId: string) {
    const user = await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        emailVerified: true,
      },
      { new: true },
    );

    return user;
  }

  // async removeUserProfile(userId: string) {
  //   const response = [];

  //   const availability = await this.availabilityModel.find({});
  //   const availabilityModel = await this.availabilityModel
  //     .deleteMany({ userId: userId })
  //     .exec();

  //   const messages = await this.messageModel.find({});
  //   const messageModel = await this.messageModel
  //     .deleteMany({
  //       senderId: userId,
  //     })
  //     .exec();

  //   const notes = await this.notesModel.find({});
  //   const notesModel = await this.notesModel
  //     .deleteMany({
  //       $or: [{ therapistId: userId }, { userId: userId }],
  //     })
  //     .exec();

  //   const shortlistedTherapists = await this.shortlistedTherapists.find({});
  //   const shortlistedTherapistModel = await this.shortlistedTherapists
  //     .deleteMany({ $or: [{ therapistId: userId }, { userId: userId }] })
  //     .exec();

  //   const therapistProfile = await this.therapistProfileModel.find({});
  //   const therapistProfileModel = await this.therapistProfileModel
  //     .deleteMany({ user: userId })
  //     .exec();

  //   const tokens = await this.tokenModel.find({});
  //   const tokenModel = await this.tokenModel
  //     .deleteMany({ userId: userId })
  //     .exec();

  //   const userProfiles = await this.userProfileModel.find({});
  //   const userProfileModel = await this.userProfileModel
  //     .deleteMany({ user: userId })
  //     .exec();

  //   const users = await this.userModel.find({});
  //   const userModel = await this.userModel.deleteMany({ _id: userId }).exec();

  //   const wallets = await this.walletModel.find({});
  //   const walletModel = await this.walletModel
  //     .deleteMany({ user: userId })
  //     .exec();

  //   response.push(
  //     { availabilityModel: availability },
  //     { messageModel: messages },
  //     { notesModel: notes },
  //     { shortlistedTherapists: shortlistedTherapists },
  //     { therapistProfileModel: therapistProfile },
  //     { tokenModel: tokens },
  //     { userProfileModel: userProfiles },
  //     { userModel: users },
  //     { walletModel: walletModel },
  //   );

  //   return response;
  // }
}
