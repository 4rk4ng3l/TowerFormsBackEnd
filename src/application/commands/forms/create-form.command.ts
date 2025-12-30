import { ICommand } from '@shared/interfaces/command-handler.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateFormStepDto {
  stepNumber: number;
  title: string;
  questions: CreateQuestionDto[];
}

export interface CreateQuestionDto {
  questionText: string;
  type: 'text' | 'multiple_choice' | 'single_choice';
  options?: string[];
  isRequired: boolean;
  orderNumber: number;
}

export class CreateFormCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly steps: CreateFormStepDto[]
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
