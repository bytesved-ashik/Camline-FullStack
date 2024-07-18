import { Module } from '@nestjs/common';
import { CategoryRepository } from '@repositories/category.repository';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category } from '@entities/category.entity';
import { CategorySchema } from '@entities/category.entity';

import * as paginate from 'mongoose-paginate-v2';
import * as softDelete from 'mongoose-delete';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Category.name,
        useFactory: () => {
          CategorySchema.plugin(paginate);
          CategorySchema.plugin(softDelete, {
            deletedAt: true,
            overrideMethods: true,
            indexFields: ['deleted', 'deletedAt'],
          });

          return CategorySchema;
        },
      },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
