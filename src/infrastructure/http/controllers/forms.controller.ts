import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateFormCommand } from '@application/commands/forms/create-form.command';
import { CreateFormHandler } from '@application/commands/forms/create-form.handler';
import { GetFormQuery } from '@application/queries/forms/get-form.query';
import { GetFormHandler } from '@application/queries/forms/get-form.handler';
import { ListFormsQuery } from '@application/queries/forms/list-forms.query';
import { ListFormsHandler } from '@application/queries/forms/list-forms.handler';
import { logger } from '@shared/utils/logger';

@injectable()
export class FormsController {
  constructor(
    @inject(CreateFormHandler) private readonly createFormHandler: CreateFormHandler,
    @inject(GetFormHandler) private readonly getFormHandler: GetFormHandler,
    @inject(ListFormsHandler) private readonly listFormsHandler: ListFormsHandler
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const { name, description, steps } = req.body;

    const command = new CreateFormCommand(name, description, steps);
    const form = await this.createFormHandler.handle(command);

    res.status(201).json({
      success: true,
      data: form
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const query = new GetFormQuery(id);
    const form = await this.getFormHandler.handle(query);

    res.status(200).json({
      success: true,
      data: form
    });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = new ListFormsQuery();
    const forms = await this.listFormsHandler.handle(query);

    res.status(200).json({
      success: true,
      data: forms
    });
  }
}
