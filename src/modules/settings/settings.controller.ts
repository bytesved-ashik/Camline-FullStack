import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { RolesGuard } from '@classes/role.guard';
import { ROLE } from '@enums';
import { Roles } from '@decorators/role.decorator';
import { GetQueryDto } from '@dto/getQuery.dto';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { colonToObject, pick } from '@utils/object.util';
import { ISettingsDocument } from 'src/types/interfaces/entities/settings.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get('/private')
  getPrivateSettings(@Query() query: GetQueryDto) {
    const filter: FilterQuery<ISettingsDocument> = { private: true };
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }

    return this.settingsService.getSettings(filter, options);
  }

  @Get('/public')
  getPublicSettings(@Query() query: GetQueryDto) {
    const options: PaginateOptions = pick(query, ['limit', 'page', 'sort']);
    const filter: FilterQuery<ISettingsDocument> = { private: false };

    if (options.sort) {
      options.sort = colonToObject(options.sort as (typeof query)['sort']);
    }
    return this.settingsService.getSettings(filter, options);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingDto: CreateSettingDto) {
    return this.settingsService.update(id, updateSettingDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }
}
