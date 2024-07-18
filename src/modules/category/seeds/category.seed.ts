import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { CategoryService } from '../category.service';

@Injectable()
export class CategorySeed {
  constructor(private readonly categoryService: CategoryService) {}

  @Command({
    command: 'create:category',
    describe: 'create default categories.',
  })
  async create() {
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

    const categories = await this.categoryService.seedCategory(data);
    console.log('categories : ', categories);
  }
}
