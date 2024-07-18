import { InjectModel } from '@nestjs/mongoose';
import { Settings } from '@entities/settings.entity';
import {
  ISettingsDocument,
  ISettingsModel,
} from 'src/types/interfaces/entities/settings.interface';
import { CreateSettingDto } from '@modules/settings/dto/create-setting.dto';
import { FilterQuery, PaginateOptions } from 'mongoose';

export class SettingsRepository {
  constructor(
    @InjectModel(Settings.name) private readonly settingsModel: ISettingsModel,
  ) {}

  async createSettings(settings: CreateSettingDto) {
    let existingModel = await this.settingsModel.findOne({ key: settings.key });

    if (!existingModel) {
      existingModel = new this.settingsModel(settings);
    }

    return await existingModel.save();
  }

  async getSettings(
    filter: FilterQuery<ISettingsDocument>,
    options: PaginateOptions,
  ) {
    return await this.settingsModel.paginate(filter, options);
  }

  async getSettingByKey(key: string) {
    return await this.settingsModel.findOne({ key });
  }

  async updateSetting(id: string, setting: CreateSettingDto) {
    return await this.settingsModel.findByIdAndUpdate(id, {
      $set: { ...setting },
    });
  }

  async deleteSetting(id: string) {
    return await this.settingsModel.findByIdAndDelete(id);
  }
}
