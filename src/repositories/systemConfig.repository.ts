import { SystemConfig } from '@entities/systemConfig.entity';
import { UpdateSystemConfigDto } from '@modules/systemConfig/dto/updateSystemConfig.dto';
import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ISystemConfigModel } from 'src/types/interfaces/entities/system-config.interface';

export class SystemConfigRepository {
  constructor(
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: ISystemConfigModel,
  ) {}

  async updateSystemConfig(updateSystemConfigDto: UpdateSystemConfigDto) {
    const updatedSysConfig = await this.systemConfigModel.findOneAndUpdate(
      {},
      {
        $set: { ...updateSystemConfigDto },
      },
      { new: true, upsert: true },
    );

    return await updatedSysConfig;
  }

  async getCallChargePerMinute() {
    const getSystemConfig = await this.systemConfigModel.findOne({});

    if (
      !getSystemConfig ||
      !getSystemConfig.systemVariables ||
      !getSystemConfig.systemVariables.CALL_CHARGE_PER_MINUTE
    ) {
      // throw new BadRequestException(
      //   'Please configure system variables into databse.',
      // );

      return 1;
    }

    return await getSystemConfig.systemVariables.CALL_CHARGE_PER_MINUTE;
  }
}
