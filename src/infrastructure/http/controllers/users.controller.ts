import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ListUsersQuery } from '@application/queries/users/list-users.query';
import { ListUsersHandler } from '@application/queries/users/list-users.handler';
import { ListPendingUsersQuery } from '@application/queries/users/list-pending-users.query';
import { ListPendingUsersHandler } from '@application/queries/users/list-pending-users.handler';
import { GetUserQuery } from '@application/queries/users/get-user.query';
import { GetUserHandler } from '@application/queries/users/get-user.handler';
import { ApproveUserCommand } from '@application/commands/users/approve-user.command';
import { ApproveUserHandler } from '@application/commands/users/approve-user.handler';
import { CreateUserCommand } from '@application/commands/users/create-user.command';
import { CreateUserHandler } from '@application/commands/users/create-user.handler';
import { ChangeUserPasswordCommand } from '@application/commands/users/change-user-password.command';
import { ChangeUserPasswordHandler } from '@application/commands/users/change-user-password.handler';
import { UpdateUserStatusCommand } from '@application/commands/users/update-user-status.command';
import { UpdateUserStatusHandler } from '@application/commands/users/update-user-status.handler';

@injectable()
export class UsersController {
  constructor(
    @inject(ListUsersHandler) private readonly listUsersHandler: ListUsersHandler,
    @inject(ListPendingUsersHandler) private readonly listPendingUsersHandler: ListPendingUsersHandler,
    @inject(GetUserHandler) private readonly getUserHandler: GetUserHandler,
    @inject(ApproveUserHandler) private readonly approveUserHandler: ApproveUserHandler,
    @inject(CreateUserHandler) private readonly createUserHandler: CreateUserHandler,
    @inject(ChangeUserPasswordHandler) private readonly changeUserPasswordHandler: ChangeUserPasswordHandler,
    @inject(UpdateUserStatusHandler) private readonly updateUserStatusHandler: UpdateUserStatusHandler
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = new ListUsersQuery();
    const users = await this.listUsersHandler.handle(query);

    res.status(200).json({
      success: true,
      data: users
    });
  }

  async listPending(req: Request, res: Response): Promise<void> {
    const query = new ListPendingUsersQuery();
    const users = await this.listPendingUsersHandler.handle(query);

    res.status(200).json({
      success: true,
      data: users
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;

    const query = new GetUserQuery(id);
    const user = await this.getUserHandler.handle(query);

    res.status(200).json({
      success: true,
      data: user
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName, roleName } = req.body;

    const command = new CreateUserCommand(
      email,
      password,
      firstName,
      lastName,
      roleName
    );

    const user = await this.createUserHandler.handle(command);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status.getValue(),
        role: user.role.name
      }
    });
  }

  async approve(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const approverId = req.user!.userId;

    const command = new ApproveUserCommand(id, approverId);
    const user = await this.approveUserHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status.getValue(),
        approvedBy: user.approvedBy,
        approvedAt: user.approvedAt
      }
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    const command = new ChangeUserPasswordCommand(id, newPassword);
    await this.changeUserPasswordHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status } = req.body;

    const command = new UpdateUserStatusCommand(id, status);
    const user = await this.updateUserStatusHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: {
        id: user.id,
        email: user.email.getValue(),
        status: user.status.getValue()
      }
    });
  }
}
