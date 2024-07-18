import { Module } from '@nestjs/common';
import * as paginate from 'mongoose-paginate-v2';
import { MongooseModule } from '@nestjs/mongoose';

import { BlogRepository } from '@repositories/blog.repository';
import { Blog, BlogSchema } from '@entities/blog.entity';

import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import toJSON from '@entities/plugins/toJSON.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Blog.name,
        useFactory: () => {
          BlogSchema.plugin(paginate);
          BlogSchema.plugin(toJSON);
          return BlogSchema;
        },
      },
    ]),
  ],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository],
  exports: [],
})
export class BlogModule {}
