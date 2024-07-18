import { UserService } from '@modules/user/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserDocument } from '@interfaces';
import { ROLE, TOKEN_TYPE } from 'src/types/enums';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { ConfigService } from 'src/config/config.service';
import { ClientSession } from 'mongoose';
import { TOKEN_EXPIRES_IN_HOURS } from '@constants/index';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(user: IUserDocument, loginRole?: ROLE) {
    // TODO: implement different approach for login of user with multiple roles
    let role = loginRole;

    if (!role) {
      role = user.roles.at(0);
    }

    const payload = { sub: user._id, role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(
        { ...payload, type: TOKEN_TYPE.REFRESH },
        { expiresIn: this.configService.getRefreshTokenExpiresIn() },
      ),
      user: { ...user.toJSON(), role },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decodedToken = await this.jwtService.verifyAsync(dto.refresh_token);
      if (decodedToken.type !== TOKEN_TYPE.REFRESH) {
        throw new UnauthorizedException('Invalid token');
      }
      const user = await this.userService.getUserById(decodedToken.sub);
      if (user === null) {
        throw new UnauthorizedException('Invalid token');
      }
      const payload = { sub: user._id, role: user.roles[0] };
      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(
          { ...payload, type: TOKEN_TYPE.REFRESH },
          { expiresIn: this.configService.getRefreshTokenExpiresIn() },
        ),
        user: { ...user.toJSON() },
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<IUserDocument | null> {
    const user = await this.userService.getUserByEmail(email);
    if (
      user &&
      (await user.comparePassword(password))
      // &&
      // user.status === USER_STATUS.ACTIVE  // commented beacuse therapist by default status will in-active and admin active therapist from dashboard
    ) {
      // TODO: check email verified
      return user;
    }
    return null;
  }

  async createEmailToken(user: IUserDocument) {
    const role = user.roles.at(0);
    const expiresInHours = TOKEN_EXPIRES_IN_HOURS;
    const payload = { sub: user._id, role };
    const token = this.jwtService.sign(payload, {
      expiresIn: expiresInHours * 60 * 60,
    });
    return token;
  }

  async verifyEmailToken(token: string, session: ClientSession) {
    try {
      const isValidToken = await this.userService.getTokenByToken(token);

      if (!isValidToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const decodedToken = await this.jwtService.verifyAsync(token);

      const user = await this.userService.getUserById(decodedToken.sub);

      if (user === null) {
        throw new UnauthorizedException('Invalid token');
      }

      await this.userService.verifyEmail(user, session);

      await this.userService.deleteUserTokenData(decodedToken.sub);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
