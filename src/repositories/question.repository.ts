import { InjectModel } from '@nestjs/mongoose';
import { CreateQuestionDto } from '@modules/question/dto/create-question.dto';
import { Question } from '@entities/question.entity';
import { IQuestionModel } from '@interfaces';

export class QuestionRepository {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: IQuestionModel,
  ) {}

  async createQuestion(question: CreateQuestionDto) {
    return await this.questionModel.create(question);
  }
  async getAllQuestions(role: string) {
    return await this.questionModel.find({ role: role }).sort({ showOrder: 1 });
  }

  async getQuestionById(id: string) {
    return await this.questionModel.findById(id);
  }

  async updateQuestion(id: string, question: CreateQuestionDto) {
    return await this.questionModel.findByIdAndUpdate(id, {
      $set: { ...question },
    });
  }

  async deleteQuestion(id: string) {
    return await this.questionModel.findByIdAndDelete(id);
  }

  async seedUserQuestion(question: CreateQuestionDto) {
    return await this.questionModel.findOneAndUpdate(
      { role: question.role },
      question,
      { new: true, upsert: true },
    );
  }
}
