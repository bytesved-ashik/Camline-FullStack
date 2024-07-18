import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenRepository } from '@repositories/token.repository';
import { ClientSession } from 'mongoose';
import { TOKEN_TYPE } from '@enums';
import { CreateTokenDto } from './dto/createToken.dto';
import { IUserDocument } from 'src/types/interfaces';

@Injectable()
export class TokenService {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async createOTP(createTokenDto: CreateTokenDto, session: ClientSession) {
    const token = await this.tokenRepository.createOTP(createTokenDto, session);
    return token;
  }

  async createEmailTokenData(
    user: IUserDocument,
    token: string,
    session: ClientSession,
    VATnumber?: string,
  ) {
    const tokenData = await this.tokenRepository.createEmailTokenData(
      user,
      token,
      session,
      VATnumber,
    );
    return tokenData;
  }

  async getUserVerificationToken(userId: string, tokenType: TOKEN_TYPE) {
    const token = await this.tokenRepository.getUserVerificationToken(
      userId,
      tokenType,
    );
    if (!token) {
      throw new UnauthorizedException({ message: 'Invalid Token' });
    }

    if (await token.isExpired()) {
      throw new UnauthorizedException({ message: 'Token is expired' });
    }
    return token;
  }

  async deleteToken(tokenId: string, session: ClientSession) {
    const token = await this.tokenRepository.deleteToken(tokenId, session);
    return token;
  }

  async getTokenByToken(tokenId: string) {
    const token = await this.tokenRepository.getTokenByToken(tokenId);
    return token;
  }

  async getToken(token: string) {
    const tokenData = await this.tokenRepository.getToken(token);
    return tokenData;
  }
}
