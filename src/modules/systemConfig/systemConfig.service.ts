import { Injectable } from '@nestjs/common';
import { SystemConfigRepository } from '@repositories/systemConfig.repository';
import { UpdateSystemConfigDto } from './dto/updateSystemConfig.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  async updateSystemConfig(updateSystemConfigDto: UpdateSystemConfigDto) {
    const updatedSysConfig =
      await this.systemConfigRepository.updateSystemConfig(
        updateSystemConfigDto,
      );
    return updatedSysConfig;
  }
}
