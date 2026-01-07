import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class CreateSubmissionCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly formId: string,
    public readonly userId: string,
    public readonly metadata?: Record<string, any>
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
