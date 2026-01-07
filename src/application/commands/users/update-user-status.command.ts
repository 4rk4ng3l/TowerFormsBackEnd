import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command.interface';

export class UpdateUserStatusCommand implements ICommand {
  public readonly commandId: string;

  constructor(
    public readonly userId: string,
    public readonly status: 'ACTIVE' | 'INACTIVE'
  ) {
    this.commandId = uuidv4();
  }
}
