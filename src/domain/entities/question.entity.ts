import { QuestionType } from '../value-objects/question-type.vo';

export class Question {
  constructor(
    public readonly id: string,
    public readonly stepId: string,
    public readonly questionText: string,
    public readonly type: QuestionType,
    public readonly options: string[] | null,
    public readonly isRequired: boolean,
    public readonly orderNumber: number,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    stepId: string,
    questionText: string,
    type: QuestionType,
    options: string[] | null,
    isRequired: boolean,
    orderNumber: number
  ): Question {
    return new Question(
      id,
      stepId,
      questionText,
      type,
      options,
      isRequired,
      orderNumber,
      new Date()
    );
  }

  isMultipleChoice(): boolean {
    return this.type === QuestionType.MULTIPLE_CHOICE || this.type === QuestionType.SINGLE_CHOICE;
  }

  requiresOptions(): boolean {
    return this.isMultipleChoice();
  }

  isValid(): boolean {
    const hasText = this.questionText.trim().length > 0;
    const hasValidOrder = this.orderNumber > 0;
    const hasOptionsIfRequired = !this.requiresOptions() || (this.options !== null && this.options.length > 0);

    return hasText && hasValidOrder && hasOptionsIfRequired;
  }

  validateAnswer(answer: string | string[]): boolean {
    if (this.type === QuestionType.TEXT) {
      return typeof answer === 'string' && answer.trim().length > 0;
    }

    if (this.type === QuestionType.SINGLE_CHOICE) {
      return typeof answer === 'string' && this.options?.includes(answer) || false;
    }

    if (this.type === QuestionType.MULTIPLE_CHOICE) {
      if (!Array.isArray(answer)) return false;
      return answer.every(a => this.options?.includes(a) || false);
    }

    return false;
  }
}
