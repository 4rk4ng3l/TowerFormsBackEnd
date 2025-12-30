import { AnswerValue } from '../value-objects/answer-value.vo';

export class Answer {
  constructor(
    public readonly id: string,
    public readonly submissionId: string,
    public readonly questionId: string,
    public readonly value: AnswerValue,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    submissionId: string,
    questionId: string,
    value: AnswerValue
  ): Answer {
    return new Answer(
      id,
      submissionId,
      questionId,
      value,
      new Date()
    );
  }

  isTextAnswer(): boolean {
    return this.value.isText();
  }

  isChoiceAnswer(): boolean {
    return this.value.isChoice();
  }

  getValue(): string | string[] {
    return this.value.getValue();
  }

  isValid(): boolean {
    return this.value.isValid();
  }
}
