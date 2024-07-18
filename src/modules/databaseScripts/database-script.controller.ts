import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  AddBalanceToUserDto,
  DatabaseScriptTokenDto,
  RemoveUserProfileDto,
  VerifyEmailDto,
} from './dto/script-token.dto';
import { DatabaseScriptService } from './database-script.service';
import { Roles } from '@decorators/role.decorator';
import { ROLE } from 'src/types/enums';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { RolesGuard } from '@classes/role.guard';

@Controller('database-script')
export class DatabaseScriptController {
  constructor(private readonly databaseScriptService: DatabaseScriptService) {}

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('test')
  async test(@Body() body: DatabaseScriptTokenDto) {
    try {
      const responseData = { msg: 'Test routes run' };

      return responseData;
    } catch (error) {
      console.log('body : ', body);
      console.log('Error:DatabaseScriptController:test : ', error);
      throw error;
    }
  }

  // @Roles(ROLE.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('clear-all-tables')
  // async clearAllTablesData(@Body() body: DatabaseScriptTokenDto) {
  //   try {
  //     const responseData = await this.databaseScriptService.deleteAllRecords();

  //     return responseData;
  //   } catch (error) {
  //     console.log('body : ', body);
  //     console.log(
  //       'Error:DatabaseScriptController:clearAllTablesData : ',
  //       error,
  //     );
  //     throw error;
  //   }
  // }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('remove-all-free-minutes')
  async removeAllFreeMinutes(@Body() body: DatabaseScriptTokenDto) {
    try {
      const responseData =
        await this.databaseScriptService.removeAllFreeMinutes();

      return responseData;
    } catch (error) {
      console.log('body : ', body);
      console.log(
        'Error:DatabaseScriptController:removeAllFreeMinutes : ',
        error,
      );
      throw error;
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('add-balance-to-user')
  async addBalanceToUser(@Body() body: AddBalanceToUserDto) {
    try {
      const { userId, amount } = body;

      const responseData = await this.databaseScriptService.addBalanceToUser(
        userId,
        amount,
      );

      return responseData;
    } catch (error) {
      console.log('body : ', body);
      console.log('Error:DatabaseScriptController:addBalanceToUser : ', error);
      throw error;
    }
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verifyEmail')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    try {
      const { userId } = body;

      const responseData = await this.databaseScriptService.verifyEmail(userId);

      return responseData;
    } catch (error) {
      console.log('body : ', body);
      console.log('Error:DatabaseScriptController:user : ', error);
      throw error;
    }
  }

  // @Roles(ROLE.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('/remove-user-profile')
  // async removeUserProfileremoveUserProfile(@Body() body: RemoveUserProfileDto) {
  //   try {
  //     const { userId } = body;
  //     const responseData = await this.databaseScriptService.removeUserProfile(
  //       userId,
  //     );

  //     return responseData;
  //   } catch (error) {
  //     console.log('body : ', body);
  //     console.log('Error:DatabaseScriptController:removeUserProfile : ', error);
  //     throw error;
  //   }
  // }
}
