import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ListRolesQuery } from '@application/queries/roles/list-roles.query';
import { ListRolesHandler } from '@application/queries/roles/list-roles.handler';

@injectable()
export class RolesController {
  constructor(
    @inject(ListRolesHandler) private readonly listRolesHandler: ListRolesHandler
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = new ListRolesQuery();
    const roles = await this.listRolesHandler.handle(query);

    res.status(200).json({
      success: true,
      data: roles
    });
  }
}
