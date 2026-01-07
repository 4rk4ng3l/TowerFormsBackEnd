import { v4 as uuidv4 } from 'uuid';
import { IQuery } from '@shared/interfaces/query.interface';

export class ListPendingUsersQuery implements IQuery {
  public readonly queryId: string;

  constructor() {
    this.queryId = uuidv4();
  }
}
