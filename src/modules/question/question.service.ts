import { Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionRepository } from '../../repositories/question.repository';

@Injectable()
export class QuestionService {
  constructor(private readonly questionRepository: QuestionRepository) {}
  async getQuestions(role: string) {
    const questions = await this.questionRepository.getAllQuestions(role);
    return questions;
  }

  async getQuestionById(id: string) {
    const question = await this.questionRepository.getQuestionById(id);
    return question;
  }

  async createQuestion(body: CreateQuestionDto) {
    const question = await this.questionRepository.createQuestion(body);
    return question;
  }

  async updateQuestion(id: string, body: CreateQuestionDto) {
    const question = await this.questionRepository.updateQuestion(id, body);
    return question;
  }

  async deleteQuestion(id: string) {
    const question = await this.questionRepository.deleteQuestion(id);
    return question;
  }

  async seedUserQuestion(body: CreateQuestionDto) {
    const question = await this.questionRepository.seedUserQuestion(body);
    return question;
  }
}
