import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class ApproveUserCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly approverId: string
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
