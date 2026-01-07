import { IQuery } from '@shared/interfaces/query-handler.interface';
import { v4 as uuidv4 } from 'uuid';

export class GetCurrentUserQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string
  ) {
    this.queryId = uuidv4();
    this.timestamp = new Date();
  }
}
