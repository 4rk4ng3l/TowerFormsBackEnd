import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export interface SubmissionAnswerDto {
  questionId: string;
  answerText?: string;
  answerValue?: string[];
}

export class UpdateSubmissionCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly submissionId: string,
    public readonly answers: SubmissionAnswerDto[],
    public readonly metadata?: Record<string, any>
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
