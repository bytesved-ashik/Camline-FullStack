import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, PaginateOptions, PaginateResult } from 'mongoose';

import { CreateBlogDto } from '@modules/blog/dto/create-blog.dto';
import { Blog } from '@entities/blog.entity';
import { IBlogDocument, IBlogModel } from '@interfaces';

export class BlogRepository {
  constructor(@InjectModel(Blog.name) private readonly blogModel: IBlogModel) {}

  async createBlog(blog: CreateBlogDto) {
    return await this.blogModel.create(blog);
  }

  async getAllBlogs(
    filter: FilterQuery<IBlogDocument>,
    options: PaginateOptions,
  ) {
    const projects: PaginateResult<IBlogDocument> =
      await this.blogModel.paginate(filter, options);
    return projects;
  }

  async getBlogById(id: string) {
    return await this.blogModel.findById(id);
  }

  async updateBlog(id: string, blog: CreateBlogDto) {
    return await this.blogModel.findByIdAndUpdate(
      id,
      {
        $set: { ...blog },
      },
      { new: true },
    );
  }

  async deleteBlog(id: string) {
    return await this.blogModel.findByIdAndDelete(id);
  }
}
