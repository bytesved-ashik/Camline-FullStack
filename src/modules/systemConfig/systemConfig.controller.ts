import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { ROLE } from '../../types/enums/role.enum';
import { RolesGuard } from '../../types/classes/role.guard';
import { Roles } from '../../types/decorators/role.decorator';
import { SystemConfigService } from './systemConfig.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UpdateSystemConfigDto } from './dto/updateSystemConfig.dto';

@ApiTags('System config')
@ApiBearerAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/update-system-config')
  @ApiOperation({
    description: 'Get and update system config.',
  })
  async updateSystemConfig(
    @Body() updateSystemConfigDto: UpdateSystemConfigDto,
  ) {
    try {
      const updatedSysConfig =
        await this.systemConfigService.updateSystemConfig(
          updateSystemConfigDto,
        );
      return updatedSysConfig;
    } catch (error) {
      throw error;
    }
  }
}
