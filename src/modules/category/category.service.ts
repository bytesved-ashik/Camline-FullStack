import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '@repositories/category.repository';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { ICategoryDocument } from 'src/types/interfaces';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}
  async getCategories(
    filter: FilterQuery<ICategoryDocument>,
    options?: PaginateOptions,
  ) {
    const categories = await this.categoryRepository.getAllCategories(
      filter,
      options,
    );
    return categories;
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.getCategoryById(id);
    return category;
  }

  async createCategory(body: CreateCategoryDto) {
    const category = await this.categoryRepository.createCategory(body);
    return category;
  }

  async updateCategory(id: string, body: CreateCategoryDto) {
    const category = await this.categoryRepository.updateCategory(id, body);
    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.deleteCategory(id);
    return category;
  }

  async seedCategory(body: CreateCategoryDto[]) {
    const categories = await this.categoryRepository.seedCategory(body);
    return categories;
  }
}
