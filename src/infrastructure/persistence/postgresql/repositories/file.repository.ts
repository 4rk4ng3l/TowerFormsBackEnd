import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { File } from '@domain/entities/file.entity';
import { SyncStatus } from '@domain/value-objects/sync-status.vo';

@injectable()
export class FileRepository implements IFileRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<File | null> {
    const fileData = await this.prisma.file.findUnique({
      where: { id }
    });

    if (!fileData) {
      return null;
    }

    return this.toDomain(fileData);
  }

  async findBySubmissionId(submissionId: string): Promise<File[]> {
    const files = await this.prisma.file.findMany({
      where: { submissionId }
    });

    return files.map(file => this.toDomain(file));
  }

  async findByStepId(stepId: string): Promise<File[]> {
    const files = await this.prisma.file.findMany({
      where: { stepId }
    });

    return files.map(file => this.toDomain(file));
  }

  async findUnsynced(): Promise<File[]> {
    const files = await this.prisma.file.findMany({
      where: {
        syncStatus: {
          in: ['pending', 'failed']
        }
      }
    });

    return files.map(file => this.toDomain(file));
  }

  async create(file: File): Promise<File> {
    const created = await this.prisma.file.create({
      data: this.toPersistence(file)
    });

    return this.toDomain(created);
  }

  async update(file: File): Promise<File> {
    const updated = await this.prisma.file.update({
      where: { id: file.id },
      data: this.toPersistence(file)
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({
      where: { id }
    });
  }

  async markAsSynced(id: string, remotePath: string): Promise<File> {
    const updated = await this.prisma.file.update({
      where: { id },
      data: {
        syncStatus: 'synced',
        remotePath
      }
    });

    return this.toDomain(updated);
  }

  async markAsFailed(id: string): Promise<File> {
    const updated = await this.prisma.file.update({
      where: { id },
      data: {
        syncStatus: 'failed'
      }
    });

    return this.toDomain(updated);
  }

  async countBySubmissionId(submissionId: string): Promise<number> {
    return this.prisma.file.count({
      where: { submissionId }
    });
  }

  private toDomain(data: any): File {
    const syncStatus = data.syncStatus as SyncStatus;

    return new File(
      data.id,
      data.submissionId,
      data.stepId,
      data.questionId,
      data.localPath,
      data.remotePath,
      data.fileName,
      data.fileSize,
      data.mimeType,
      syncStatus,
      new Date(data.createdAt)
    );
  }

  private toPersistence(file: File): any {
    return {
      id: file.id,
      submissionId: file.submissionId,
      stepId: file.stepId,
      questionId: file.questionId,
      localPath: file.localPath,
      remotePath: file.remotePath,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      syncStatus: file.syncStatus.toString(),
      createdAt: file.createdAt
    };
  }
}
