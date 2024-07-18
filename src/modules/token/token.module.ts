import { Token, TokenSchema } from '@entities/token.entity';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenRepository } from '@repositories/token.repository';
import { TokenService } from './token.service';
import { ConfigService } from 'src/config/config.service';
import toJSON from '@entities/plugins/toJSON.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        inject: [ConfigService],
        name: Token.name,
        useFactory: (configService: ConfigService) => {
          TokenSchema.method('isExpired', async function () {
            const token = await this;
            return (
              Date.parse(token.createdAt) +
                parseInt(configService.get('OTP_EXPIRATION_TIME_MINUTE'), 10) *
                  60 *
                  1000 <
              Date.now()
            );
          });

          TokenSchema.plugin(toJSON);

          return TokenSchema;
        },
      },
    ]),
  ],
  providers: [TokenService, TokenRepository],
  exports: [TokenService, TokenRepository],
})
export class TokenModule {}
