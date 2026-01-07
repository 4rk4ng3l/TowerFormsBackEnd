import { ICommand } from '@shared/interfaces/command-handler.interface';
import { v4 as uuidv4 } from 'uuid';

export class LoginCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly password: string
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
