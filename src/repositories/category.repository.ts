import { InjectModel } from '@nestjs/mongoose';
import { Category } from '@entities/category.entity';
import { ICategoryDocument, ICategoryModel } from '@interfaces';
import { CreateCategoryDto } from '@modules/category/dto/create-category.dto';
import { ClientSession, FilterQuery, PaginateOptions } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

export class CategoryRepository {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: ICategoryModel,
  ) {}

  async getAllCategories(
    filter: FilterQuery<ICategoryDocument>,
    options?: PaginateOptions,
  ) {
    return this.categoryModel.paginate(filter, options);
  }

  async createCategory(
    categoryDto: CreateCategoryDto,
    session?: ClientSession,
  ) {
    const categoryExists = await this.categoryModel.findOne({
      name: categoryDto.name,
    });
    if (categoryExists) throw new Error('Category already exists');

    const category = new this.categoryModel(categoryDto);

    category.save({ session });

    return category;
  }

  async getCategoryById(id: string) {
    return await this.categoryModel.findById(id);
  }

  async updateCategory(
    id: string,
    updateCategoryParams: CreateCategoryDto,
    session?: ClientSession,
  ) {
    const category = await this.getCategoryById(id);
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, updateCategoryParams);
    category.save({ session });

    return category;
  }

  async deleteCategory(id: string, session?: ClientSession) {
    const category = await this.getCategoryById(id);
    if (!category) throw new NotFoundException('Category not found');

    category.delete({ session });

    return category;
  }

  async seedCategory(body: CreateCategoryDto[]) {
    const categories = [];

    for (let i = 0; i < body.length; i++) {
      const category = body[i];

      const updatedCategory = await this.categoryModel.findOneAndUpdate(
        { name: category.name },
        { name: category.name },
        { new: true, upsert: true },
      );

      categories.push(updatedCategory);
    }

    return categories;
  }
}
