import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../repositories/user.repository.interface';
import { IPermissionRepository } from '../repositories/permission.repository.interface';
import { ISubmissionRepository } from '../repositories/submission.repository.interface';

@injectable()
export class AuthorizationService {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return false;
    }

    if (!user.isActive()) {
      return false;
    }

    return user.hasPermission(resource, action);
  }

  async canAccessSubmission(userId: string, submissionId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return false;
    }

    if (!user.isActive()) {
      return false;
    }

    // Admin and Consultant can access all submissions
    if (user.isAdmin() || user.isConsultant()) {
      return true;
    }

    // Technicians can only access their own submissions
    if (user.isTechnician()) {
      const submission = await this.submissionRepository.findById(submissionId);
      if (!submission) {
        return false;
      }
      return submission.userId === userId;
    }

    return false;
  }

  async canApproveUser(approverId: string, userIdToApprove: string): Promise<boolean> {
    if (approverId === userIdToApprove) {
      return false; // Cannot approve yourself
    }

    const approver = await this.userRepository.findById(approverId);

    if (!approver) {
      return false;
    }

    if (!approver.isActive()) {
      return false;
    }

    return approver.hasPermission('users', 'approve');
  }

  async canChangeUserPassword(requesterId: string, targetUserId: string): Promise<boolean> {
    const requester = await this.userRepository.findById(requesterId);

    if (!requester) {
      return false;
    }

    if (!requester.isActive()) {
      return false;
    }

    // Users can change their own password
    if (requesterId === targetUserId) {
      return true;
    }

    // Admins can change any user's password
    return requester.hasPermission('users', 'change_password');
  }

  async canManageUser(requesterId: string, targetUserId: string): Promise<boolean> {
    if (requesterId === targetUserId) {
      return false; // Cannot manage yourself (except for profile updates)
    }

    const requester = await this.userRepository.findById(requesterId);

    if (!requester) {
      return false;
    }

    if (!requester.isActive()) {
      return false;
    }

    return requester.hasPermission('users', 'update');
  }
}
