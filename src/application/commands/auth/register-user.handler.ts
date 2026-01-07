import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { RegisterUserCommand } from './register-user.command';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IRoleRepository } from '@domain/repositories/role.repository.interface';
import { PasswordHashingService } from '@domain/services/password-hashing.service';
import { EmailVO } from '@domain/value-objects/email.vo';
import { PasswordVO } from '@domain/value-objects/password.vo';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand, User> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    @inject(PasswordHashingService) private readonly passwordHashingService: PasswordHashingService
  ) {}

  async handle(command: RegisterUserCommand): Promise<User> {
    // Validate email format
    const email = EmailVO.fromString(command.email);

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw AuthenticationException.emailAlreadyExists();
    }

    // Validate password
    const password = PasswordVO.fromPlainText(command.password);

    // Find role
    const role = await this.roleRepository.findByName(command.roleName);
    if (!role) {
      throw NotFoundException.form(`Role '${command.roleName}' not found`);
    }

    // Hash password
    const passwordHash = await this.passwordHashingService.hash(command.password);

    // Create user entity (status will be PENDING_APPROVAL by default)
    const user = User.create(
      uuidv4(),
      email,
      passwordHash,
      command.firstName,
      command.lastName,
      role
    );

    // Save to database
    const createdUser = await this.userRepository.create(user);

    return createdUser;
  }
}
