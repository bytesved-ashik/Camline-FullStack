import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings.service';

@Injectable()
export class SettingsSeed {
  constructor(private readonly settingsService: SettingsService) {}

  @Command({
    command: 'create:deductionPercentage',
    describe: 'create default deduction percentage for all the therapist',
  })
  async create() {
    const data = { key: 'deductionPercentage', value: '10', private: false };
    await this.settingsService.create(data);
  }
}
