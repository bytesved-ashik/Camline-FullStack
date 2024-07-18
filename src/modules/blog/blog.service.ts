import { FilterQuery, PaginateOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';

import { BlogRepository } from '@repositories/blog.repository';

import { IBlogDocument } from 'src/types/interfaces';
import { CreateBlogDto } from './dto/create-blog.dto';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  async getAll(filter: FilterQuery<IBlogDocument>, options: PaginateOptions) {
    const blogs = await this.blogRepository.getAllBlogs(filter, options);
    return blogs;
  }
  async getBlogById(id: string) {
    const blog = await this.blogRepository.getBlogById(id);
    return blog;
  }

  async createBlog(body: CreateBlogDto) {
    const blog = await this.blogRepository.createBlog(body);
    return blog;
  }

  async updateBlog(id: string, body: CreateBlogDto) {
    const blog = await this.blogRepository.updateBlog(id, body);
    return blog;
  }

  async deleteBlog(id: string) {
    const blog = await this.blogRepository.deleteBlog(id);
    return blog;
  }
}
