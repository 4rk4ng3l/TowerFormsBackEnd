import { v4 as uuidv4 } from 'uuid';
import { IQuery } from '@shared/interfaces/query.interface';

export class GetUserQuery implements IQuery {
  public readonly queryId: string;

  constructor(public readonly userId: string) {
    this.queryId = uuidv4();
  }
}
