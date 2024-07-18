import { SettingsSeed } from '@modules/settings/seeds/settings.seed';
import { SettingsModule } from '@modules/settings/settings.module';
import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { QuestionModule } from '@modules/question/question.module';
import { UserQuestionSeed } from '@modules/question/seeds/user.question.seed';
import { CategoryModule } from '@modules/category/category.module';
import { CategorySeed } from '@modules/category/seeds/category.seed';

@Module({
  imports: [CommandModule, SettingsModule, QuestionModule, CategoryModule],
  providers: [SettingsSeed, UserQuestionSeed, CategorySeed],
  exports: [SettingsSeed, UserQuestionSeed, CategorySeed],
})
export class SeedsModule {}
