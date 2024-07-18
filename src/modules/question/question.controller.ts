import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ROLE } from '../../types/enums/role.enum';
import { RolesGuard } from '../../types/classes/role.guard';
import { Roles } from '../../types/decorators/role.decorator';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('/therapist')
  @ApiOperation({
    description: 'Get questions for therapist',
  })
  async getTherapistQuestions() {
    const questions = await this.questionService.getQuestions(ROLE.THERAPIST);
    return questions;
  }

  @Get('/user')
  @ApiOperation({
    description: 'Get question for user',
  })
  async getUserQuestions() {
    const questions = await this.questionService.getQuestions(ROLE.USER);
    return questions;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Post()
  @ApiOperation({
    description: 'Create question',
  })
  async createQuestion(@Body() body: CreateQuestionDto) {
    const question = await this.questionService.createQuestion(body);
    return question;
  }

  @Get('/:id')
  @ApiOperation({
    description: 'Get question by id',
  })
  async getQuestion(@Param('id') id: string) {
    const question = await this.questionService.getQuestionById(id);
    return question;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch('/:id')
  @ApiOperation({
    description: 'Update question',
  })
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: CreateQuestionDto,
  ) {
    const question = await this.questionService.updateQuestion(id, body);
    return question;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete('/:id')
  @ApiOperation({
    description: 'Delete question',
  })
  async deleteQuestion(@Param('id') id: string) {
    const question = await this.questionService.deleteQuestion(id);
    return question;
  }
}
