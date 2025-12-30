import { Question } from './question.entity';

export class FormStep {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly stepNumber: number,
    public readonly title: string,
    public readonly questions: Question[],
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    formId: string,
    stepNumber: number,
    title: string
  ): FormStep {
    return new FormStep(
      id,
      formId,
      stepNumber,
      title,
      [],
      new Date()
    );
  }

  addQuestion(question: Question): FormStep {
    return new FormStep(
      this.id,
      this.formId,
      this.stepNumber,
      this.title,
      [...this.questions, question],
      this.createdAt
    );
  }

  getRequiredQuestions(): Question[] {
    return this.questions.filter(q => q.isRequired);
  }

  isValid(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.stepNumber > 0 &&
      this.questions.length > 0 &&
      this.questions.every(q => q.isValid())
    );
  }
}
