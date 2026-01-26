import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import path from 'path';
import fs from 'fs';
import { AddFileToSubmissionCommand } from '@application/commands/files/add-file-to-submission.command';
import { AddFileToSubmissionHandler } from '@application/commands/files/add-file-to-submission.handler';
import { GetFileQuery } from '@application/queries/files/get-file.query';
import { GetFileHandler } from '@application/queries/files/get-file.handler';

@injectable()
export class FilesController {
  constructor(
    @inject(AddFileToSubmissionHandler) private readonly addFileHandler: AddFileToSubmissionHandler,
    @inject(GetFileHandler) private readonly getFileHandler: GetFileHandler
  ) {}

  async uploadFile(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file provided'
      });
      return;
    }

    const { submissionId, stepId, questionId, fileId } = req.body;

    if (!submissionId || !stepId) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        success: false,
        message: 'submissionId and stepId are required'
      });
      return;
    }

    const command = new AddFileToSubmissionCommand(
      submissionId,
      stepId,
      questionId || null,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      fileId || undefined // Optional: use client-provided ID
    );

    const file = await this.addFileHandler.handle(command);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileType: file.getFileType(),
        createdAt: file.createdAt
      }
    });
  }

  async downloadFile(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;

    const query = new GetFileQuery(id);
    const file = await this.getFileHandler.handle(query);

    if (!file.localPath || !fs.existsSync(file.localPath)) {
      res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
      return;
    }

    // Set headers for file download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Length', file.fileSize);

    // Stream file to response
    const fileStream = fs.createReadStream(file.localPath);
    fileStream.pipe(res);
  }

  async getFileInfo(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;

    const query = new GetFileQuery(id);
    const file = await this.getFileHandler.handle(query);

    res.status(200).json({
      success: true,
      data: {
        id: file.id,
        submissionId: file.submissionId,
        stepId: file.stepId,
        questionId: file.questionId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileType: file.getFileType(),
        synced: file.isSynced(),
        createdAt: file.createdAt
      }
    });
  }
}
