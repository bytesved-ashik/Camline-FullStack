import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingsRepository } from '@repositories/settings.repository';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { ISettingsDocument } from 'src/types/interfaces/entities/settings.interface';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}
  async create(createSettingDto: CreateSettingDto) {
    return await this.settingsRepository.createSettings(createSettingDto);
  }

  getSettings(
    filter: FilterQuery<ISettingsDocument>,
    options: PaginateOptions,
  ) {
    return this.settingsRepository.getSettings(filter, options);
  }

  getSettingByKey(key: string) {
    return this.settingsRepository.getSettingByKey(key);
  }

  update(id: string, setting: CreateSettingDto) {
    return this.settingsRepository.updateSetting(id, setting);
  }

  remove(id: string) {
    return this.settingsRepository.deleteSetting(id);
  }
}
