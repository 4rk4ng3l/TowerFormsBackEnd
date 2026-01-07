import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateSubmissionCommand } from '@application/commands/submissions/create-submission.command';
import { CreateSubmissionHandler } from '@application/commands/submissions/create-submission.handler';
import { UpdateSubmissionCommand } from '@application/commands/submissions/update-submission.command';
import { UpdateSubmissionHandler } from '@application/commands/submissions/update-submission.handler';
import { CompleteSubmissionCommand } from '@application/commands/submissions/complete-submission.command';
import { CompleteSubmissionHandler } from '@application/commands/submissions/complete-submission.handler';
import { GetSubmissionQuery } from '@application/queries/submissions/get-submission.query';
import { GetSubmissionHandler } from '@application/queries/submissions/get-submission.handler';
import { ListSubmissionsQuery } from '@application/queries/submissions/list-submissions.query';
import { ListSubmissionsHandler } from '@application/queries/submissions/list-submissions.handler';

@injectable()
export class SubmissionsController {
  constructor(
    @inject(CreateSubmissionHandler) private readonly createSubmissionHandler: CreateSubmissionHandler,
    @inject(UpdateSubmissionHandler) private readonly updateSubmissionHandler: UpdateSubmissionHandler,
    @inject(CompleteSubmissionHandler) private readonly completeSubmissionHandler: CompleteSubmissionHandler,
    @inject(GetSubmissionHandler) private readonly getSubmissionHandler: GetSubmissionHandler,
    @inject(ListSubmissionsHandler) private readonly listSubmissionsHandler: ListSubmissionsHandler
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const { formId, userId, metadata } = req.body;

    const command = new CreateSubmissionCommand(
      formId,
      userId,
      metadata
    );

    const submission = await this.createSubmissionHandler.handle(command);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        id: submission.id,
        formId: submission.formId,
        userId: submission.userId,
        metadata: submission.metadata,
        startedAt: submission.startedAt
      }
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { answers, metadata } = req.body;

    const command = new UpdateSubmissionCommand(
      id,
      answers || [],
      metadata
    );

    const submission = await this.updateSubmissionHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      data: {
        id: submission.id,
        answersCount: submission.answers.length,
        filesCount: submission.files.length,
        updatedAt: submission.updatedAt
      }
    });
  }

  async complete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const command = new CompleteSubmissionCommand(id);
    const submission = await this.completeSubmissionHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Submission completed successfully',
      data: {
        id: submission.id,
        completedAt: submission.completedAt
      }
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const query = new GetSubmissionQuery(id);
    const submission = await this.getSubmissionHandler.handle(query);

    res.status(200).json({
      success: true,
      data: submission
    });
  }

  async list(req: Request, res: Response): Promise<void> {
    const { formId, userId } = req.query;

    const query = new ListSubmissionsQuery(
      formId as string | undefined,
      userId as string | undefined
    );

    const submissions = await this.listSubmissionsHandler.handle(query);

    res.status(200).json({
      success: true,
      data: submissions
    });
  }
}
