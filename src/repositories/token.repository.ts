import { InjectModel } from '@nestjs/mongoose';
import { ClientSession } from 'mongoose';
import { ITokenModel, ITokenDocument, IUserDocument } from '@interfaces';
import { Token } from '@entities/token.entity';
import { CreateTokenDto } from '@modules/token/dto/createToken.dto';
import { TOKEN_TYPE } from '@enums';
import { BadRequestException } from '@nestjs/common';

export class TokenRepository {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: ITokenModel,
  ) {}

  async getUserVerificationToken(userId: string, tokenType: TOKEN_TYPE) {
    const token: ITokenDocument = await this.tokenModel.findOne({
      userId,
      tokenType,
    });
    return token;
  }

  async deleteToken(tokenId: string, session: ClientSession) {
    const token: ITokenDocument = await this.tokenModel.findByIdAndRemove(
      tokenId,
      { session },
    );
    return token;
  }

  async createOTP(createTokenDto: CreateTokenDto, session: ClientSession) {
    await this.tokenModel.deleteMany({
      userId: createTokenDto.userId,
      tokenType: createTokenDto.tokenType,
    });
    const token = new this.tokenModel(createTokenDto);

    return token.save({ session });
  }

  async createEmailToken(
    createTokenDto: CreateTokenDto,
    session: ClientSession,
  ) {
    await this.tokenModel.deleteMany({
      userId: createTokenDto.userId,
      tokenType: createTokenDto.tokenType,
    });
    const token = new this.tokenModel(createTokenDto);
    return token.save({ session });
  }

  async createEmailTokenData(
    user: IUserDocument,
    token: string,
    session: ClientSession,
    VATnumber?: string,
  ) {
    if (VATnumber) {
      const checkVATNumber = await this.tokenModel.findOne({
        'extraData.VATnumber': VATnumber,
      });

      if (checkVATNumber) {
        throw new BadRequestException('VAT Number already exists.');
      }
    }

    await this.tokenModel.deleteMany({
      userId: user._id,
      tokenType: TOKEN_TYPE.EMAIL_VERIFICATION,
    });

    const tokenData = new this.tokenModel(
      {
        userId: user.id,
        token: token,
        tokenType: TOKEN_TYPE.EMAIL_VERIFICATION,
        extraData: {
          VATnumber: VATnumber,
          roles: user.roles,
        },
      },
      session,
    );
    return tokenData.save({ session });
  }

  async getTokenByToken(token: string) {
    const tokenRecord = await this.tokenModel.findOne({
      token: token,
    });
    return tokenRecord;
  }

  async getToken(token: string) {
    const tokenData = await this.tokenModel.findOne({ token });
    return tokenData;
  }
}
