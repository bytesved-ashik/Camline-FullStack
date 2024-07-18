import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetQueryDto } from '@dto/getQuery.dto';
import { colonToObject, pick } from '@utils/object.util';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { ICategoryDocument } from 'src/types/interfaces';
import { RolesGuard } from '@classes/role.guard';
import { Roles } from '@decorators/role.decorator';
import { ROLE } from 'src/types/enums';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({
    description: 'get all categories',
  })
  async getCategories(@Query() query: GetQueryDto) {
    const filter: FilterQuery<ICategoryDocument> = pick(query, ['q']);
    const options: PaginateOptions = pick(query, [
      'limit',
      'page',
      'sort',
      'pagination',
    ]);

    if (options.sort) {
      options.sort = colonToObject(options.sort as string);
    }

    if (filter.q) {
      filter.name = { $regex: filter.q, $options: 'i' };
      delete filter.q;
    }

    const categories = await this.categoryService.getCategories(
      filter,
      options,
    );

    return categories;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @ApiOperation({
    description: 'Get category by id',
  })
  async getCategory(@Param('id') id: string) {
    const category = await this.categoryService.getCategoryById(id);
    return category;
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @ApiOperation({
    description: 'create category',
  })
  async createCategory(@Body() body: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(body);
    return category;
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('seed-category')
  @ApiOperation({
    description: 'seed category',
  })
  async seedCategory() {
    const data = [
      {
        name: 'Individual',
      },
      {
        name: 'Couple',
      },
      {
        name: 'Child',
      },
      {
        name: 'Family',
      },
      {
        name: 'Therapy',
      },
      {
        name: 'Psychotherapy',
      },
      {
        name: 'Counselling',
      },
      {
        name: 'Psychology',
      },
      {
        name: 'Psychiatry',
      },
      {
        name: 'Cognitive Behavioral Therapy',
      },
      {
        name: 'Non Cognitive Behavioral Therapy',
      },
      {
        name: 'Human Givens',
      },
    ];

    const category = await this.categoryService.seedCategory(data);
    return category;
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/:id')
  @ApiOperation({
    description: 'Update category',
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: CreateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(id, body);
    return category;
  }

  @Roles(ROLE.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/:id')
  @ApiOperation({
    description: 'Delete category',
  })
  async deleteCategory(@Param('id') id: string) {
    const category = await this.categoryService.deleteCategory(id);
    return category;
  }
}
