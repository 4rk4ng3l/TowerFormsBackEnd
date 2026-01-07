import { v4 as uuidv4 } from 'uuid';
import { IQuery } from '@shared/interfaces/query-handler.interface';

export class GetPendingSyncDataQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId?: string,
    public readonly lastSyncDate?: Date
  ) {
    this.queryId = uuidv4();
    this.timestamp = new Date();
  }
}
