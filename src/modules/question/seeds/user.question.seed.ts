import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question.service';
import { ROLE } from 'src/types/enums';

@Injectable()
export class UserQuestionSeed {
  constructor(private readonly questionService: QuestionService) {}

  @Command({
    command: 'create:user:question',
    describe: 'create default user question.',
  })
  async create() {
    const data = {
      title: 'What led you to therapy today?',
      answers: [
        'I have been feeling depressed',
        'I want to gain confidence',
        ' I feel overwhelmed or anxious',
        'I am grieving',
        ' I am going through addiction',
        'I am recovering from my addiction',
        ' I want to improve myself',
        ' I want to explore',
        'Other',
      ],
      role: ROLE.USER,
      showOrder: 1,
    };
    const addedQuestion = await this.questionService.seedUserQuestion(data);
    console.log('addedQuestion : ', addedQuestion);
  }
}
