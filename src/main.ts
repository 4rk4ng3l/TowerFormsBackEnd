import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { container } from 'tsyringe';
import { connectDatabase, disconnectDatabase, prisma } from './infrastructure/persistence/postgresql/connection';
import { errorHandler } from './infrastructure/http/middlewares/error-handler.middleware';
import { logger } from './shared/utils/logger';
import { FormValidationService } from './domain/services/form-validation.service';
import { AnswerValidationService } from './domain/services/answer-validation.service';
import { PasswordHashingService } from './domain/services/password-hashing.service';
import { TokenService } from './domain/services/token.service';
import { AuthorizationService } from './domain/services/authorization.service';
import { CreateSubmissionHandler } from './application/commands/submissions/create-submission.handler';
import { UpdateSubmissionHandler } from './application/commands/submissions/update-submission.handler';
import { CompleteSubmissionHandler } from './application/commands/submissions/complete-submission.handler';
import { GetSubmissionHandler } from './application/queries/submissions/get-submission.handler';
import { ListSubmissionsHandler } from './application/queries/submissions/list-submissions.handler';
import { AddFileToSubmissionHandler } from './application/commands/files/add-file-to-submission.handler';
import { GetFileHandler } from './application/queries/files/get-file.handler';
import { SyncSubmissionsHandler } from './application/commands/sync/sync-submissions.handler';
import { GetPendingSyncDataHandler } from './application/queries/sync/get-pending-sync-data.handler';
import { UserRepository } from './infrastructure/persistence/postgresql/repositories/user.repository';
import { RoleRepository } from './infrastructure/persistence/postgresql/repositories/role.repository';
import { PermissionRepository } from './infrastructure/persistence/postgresql/repositories/permission.repository';
import { RefreshTokenRepository } from './infrastructure/persistence/postgresql/repositories/refresh-token.repository';
import { SubmissionRepository } from './infrastructure/persistence/postgresql/repositories/submission.repository';
import { FormRepository } from './infrastructure/persistence/postgresql/repositories/form.repository';
import { FileRepository } from './infrastructure/persistence/postgresql/repositories/file.repository';

// Load environment variables
dotenv.config();

// Register PrismaClient in DI container
container.registerInstance('PrismaClient', prisma);

// Register domain services in DI container
container.registerSingleton(FormValidationService);
container.registerSingleton(AnswerValidationService);
container.registerSingleton(PasswordHashingService);
container.registerSingleton(TokenService);
container.registerSingleton(AuthorizationService);

// Register command and query handlers
container.registerSingleton(CreateSubmissionHandler);
container.registerSingleton(UpdateSubmissionHandler);
container.registerSingleton(CompleteSubmissionHandler);
container.registerSingleton(GetSubmissionHandler);
container.registerSingleton(ListSubmissionsHandler);
container.registerSingleton(AddFileToSubmissionHandler);
container.registerSingleton(GetFileHandler);
container.registerSingleton(SyncSubmissionsHandler);
container.registerSingleton(GetPendingSyncDataHandler);

// Register repositories in DI container
container.register('IUserRepository', { useClass: UserRepository });
container.register('IRoleRepository', { useClass: RoleRepository });
container.register('IPermissionRepository', { useClass: PermissionRepository });
container.register('IRefreshTokenRepository', { useClass: RefreshTokenRepository });
container.register('ISubmissionRepository', { useClass: SubmissionRepository });
container.register('IFormRepository', { useClass: FormRepository });
container.register('IFileRepository', { useClass: FileRepository });

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*'
    }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'FormsAlexia API is running',
        timestamp: new Date().toISOString()
      });
    });

    // Import routes after DI container is set up to avoid resolution errors
    const authRoutes = require('./infrastructure/http/routes/auth.routes.simple').default;
    const usersRoutes = require('./infrastructure/http/routes/users.routes').default;
    const rolesRoutes = require('./infrastructure/http/routes/roles.routes').default;
    const submissionsRoutes = require('./infrastructure/http/routes/submissions.routes').default;
    const filesRoutes = require('./infrastructure/http/routes/files.routes').default;
    const syncRoutes = require('./infrastructure/http/routes/sync.routes').default;

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', usersRoutes);
    this.app.use('/api/roles', rolesRoutes);
    this.app.use('/api/submissions', submissionsRoutes);
    this.app.use('/api/files', filesRoutes);
    this.app.use('/api/sync', syncRoutes);

    // TODO: Add more routes after their repositories are implemented
    // const formsRoutes = require('./infrastructure/http/routes/forms.routes').default;
    // this.app.use('/api/forms', formsRoutes);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    try {
      await connectDatabase();

      this.app.listen(this.port, () => {
        logger.info(`Server started successfully`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          host: process.env.HOST || 'localhost'
        });
      });
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      await disconnectDatabase();
      logger.info('Server stopped');
    } catch (error) {
      logger.error('Error stopping server', error);
    }
  }
}

const server = new Server();

server.start().catch((error) => {
  logger.error('Unhandled error during server startup', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  await server.stop();
  process.exit(0);
});
