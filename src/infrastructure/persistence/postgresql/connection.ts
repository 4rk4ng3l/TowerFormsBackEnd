import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/utils/logger';

class DatabaseConnection {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error']
      });

      logger.info('Database connection initialized');
    }

    return DatabaseConnection.instance;
  }

  static async connect(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database', error);
      throw error;
    }
  }
}

export const prisma = DatabaseConnection.getInstance();
export const connectDatabase = DatabaseConnection.connect;
export const disconnectDatabase = DatabaseConnection.disconnect;
