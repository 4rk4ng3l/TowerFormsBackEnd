import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { container } from 'tsyringe';
import { connectDatabase, disconnectDatabase } from './infrastructure/persistence/postgresql/connection';
import { errorHandler } from './infrastructure/http/middlewares/error-handler.middleware';
import formsRoutes from './infrastructure/http/routes/forms.routes';
import { logger } from './shared/utils/logger';
import { FormValidationService } from './domain/services/form-validation.service';
import { AnswerValidationService } from './domain/services/answer-validation.service';

// Load environment variables
dotenv.config();

// Register services in DI container
container.registerSingleton('FormValidationService', FormValidationService);
container.registerSingleton('AnswerValidationService', AnswerValidationService);

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

    this.app.use('/api/forms', formsRoutes);
    // TODO: Add more routes
    // this.app.use('/api/submissions', submissionsRoutes);
    // this.app.use('/api/sync', syncRoutes);
    // this.app.use('/api/images', imagesRoutes);
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
