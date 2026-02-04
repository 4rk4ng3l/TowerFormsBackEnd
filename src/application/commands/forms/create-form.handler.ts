import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { CreateFormCommand } from './create-form.command';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { Form } from '@domain/entities/form.entity';
import { FormStep } from '@domain/entities/form-step.entity';
import { Question } from '@domain/entities/question.entity';
import { QuestionType } from '@domain/value-objects/question-type.vo';
import { FormValidationService } from '@domain/services/form-validation.service';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { logger } from '@shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class CreateFormHandler implements ICommandHandler<CreateFormCommand, Form> {
  constructor(
    @inject('IFormRepository') private readonly formRepository: IFormRepository,
    private readonly formValidationService: FormValidationService
  ) {}

  async handle(command: CreateFormCommand): Promise<Form> {
    logger.info('Creating new form', { commandId: command.commandId, name: command.name });

    const formId = uuidv4();
    const steps: FormStep[] = [];

    for (const stepDto of command.steps) {
      const stepId = uuidv4();
      const questions: Question[] = [];

      for (const questionDto of stepDto.questions) {
        const questionId = uuidv4();
        const question = Question.create(
          questionId,
          stepId,
          questionDto.questionText,
          questionDto.questionDescription || null,
          questionDto.type as QuestionType,
          questionDto.options || null,
          questionDto.isRequired,
          questionDto.orderNumber
        );
        questions.push(question);
      }

      let step = FormStep.create(stepId, formId, stepDto.stepNumber, stepDto.title, stepDto.filePrefix || null);
      questions.forEach(q => {
        step = step.addQuestion(q);
      });
      steps.push(step);
    }

    let form = Form.create(formId, command.name, command.description, null, 'GREENFIELD', 1);
    steps.forEach(s => {
      form = form.addStep(s);
    });

    const validation = this.formValidationService.validateForm(form);
    if (!validation.isValid) {
      logger.error('Form validation failed', undefined, { errors: validation.errors });
      throw ValidationException.fromErrors(validation.errors);
    }

    const createdForm = await this.formRepository.create(form);
    logger.info('Form created successfully', { formId: createdForm.id });

    return createdForm;
  }
}
