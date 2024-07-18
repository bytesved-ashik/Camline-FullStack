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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ROLE } from '../../types/enums/role.enum';
import { RolesGuard } from '../../types/classes/role.guard';
import { Roles } from '../../types/decorators/role.decorator';
import { GetQueryDto } from '@dto/getQuery.dto';
import { DEFAULT_PAGE, DEFAULT_SORT, LIMIT_PER_PAGE } from '@constants/index';
import { FilterQuery } from 'mongoose';
import { IBlogDocument } from 'src/types/interfaces';
import { ResponseBlogDto } from './dto/response-blog.dto';

@ApiTags('Blog')
@ApiBearerAuth()
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({
    description: 'Get all blogs',
  })
  @ApiResponse({
    type: [ResponseBlogDto],
    status: 200,
  })
  async getAllBlogs(@Query() query: GetQueryDto) {
    const { limit, page, sort, q } = query;
    const options = {
      limit: limit ? limit : LIMIT_PER_PAGE,
      page: page ? page : DEFAULT_PAGE,
      sort: sort ? sort : DEFAULT_SORT,
    };

    let filter: FilterQuery<IBlogDocument>;
    if (q) {
      filter = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } },
        ],
      };
    }

    if (options.sort) {
      options.sort = Object.fromEntries(
        options.sort.split(',').map((field) => field.split(':')),
      );
    }
    const users = await this.blogService.getAll(filter, options);
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Post()
  @ApiOperation({
    description: 'Create blog',
  })
  async createBlog(@Body() body: CreateBlogDto) {
    const blog = await this.blogService.createBlog(body);
    return blog;
  }

  @Get('/:id')
  @ApiOperation({
    description: 'Get blog by id',
  })
  @ApiResponse({
    type: ResponseBlogDto,
    status: 200,
  })
  async getBlog(@Param('id') id: string) {
    const blog = await this.blogService.getBlogById(id);
    return blog;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch('/:id')
  @ApiOperation({
    description: 'Update blog by id',
  })
  async updateBlog(@Param('id') id: string, @Body() body: CreateBlogDto) {
    const blog = await this.blogService.updateBlog(id, body);
    return blog;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete('/:id')
  @ApiOperation({
    description: 'Delete blog',
  })
  async deleteBlog(@Param('id') id: string) {
    const blog = await this.blogService.deleteBlog(id);
    return blog;
  }
}
