import { injectable } from 'tsyringe';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { createWriteStream } from 'fs';

export interface ZipExportResult {
  url: string;
  fileName: string;
  filePath: string;
}

interface FileInfo {
  id: string;
  stepId: string;
  questionId: string | null;
  localPath: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  synced: boolean;
  createdAt: Date;
}

interface StepInfo {
  id: string;
  name: string;
  description: string | null;
  order: number;
  questions: any[];
}

interface FormInfo {
  id: string;
  name: string;
  description: string | null;
  version: number;
  metadataSchema: any;
  steps: any[];
}

interface SubmissionInfo {
  id: string;
  formId: string;
  userId: string;
  metadata: any;
  startedAt: Date;
  completedAt: Date | null;
  synced: boolean;
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class ZipGeneratorService {
  private readonly exportsDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.exportsDir = process.env.EXPORTS_DIR || './uploads/exports';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Ensure exports directory exists
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  async generateStepImagesZip(
    submission: SubmissionInfo,
    form: FormInfo,
    step: StepInfo,
    files: FileInfo[]
  ): Promise<ZipExportResult> {
    // Generate filenames
    const timestamp = Date.now();
    const sanitizedFormName = this.sanitizeFileName(form.name);
    const fileName = `${sanitizedFormName}_Step${step.order}_Imagenes.zip`;
    const uniqueFileName = `submission_${submission.id}_step_${step.order}_images_${timestamp}.zip`;
    const filePath = path.join(this.exportsDir, uniqueFileName);

    // Create write stream
    const output = createWriteStream(filePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Promise to handle archive completion
    const archivePromise = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', (err) => reject(err));
      archive.on('error', (err) => reject(err));
    });

    // Pipe archive to file
    archive.pipe(output);

    // Group files by question for better organization
    const filesByQuestion = this.groupFilesByQuestion(files);

    // Add files to archive
    for (const [questionId, questionFiles] of Object.entries(filesByQuestion)) {
      const question = this.findQuestion(step, questionId);
      const questionText = question?.text || 'Sin pregunta';

      for (let i = 0; i < questionFiles.length; i++) {
        const file = questionFiles[i];
        const filePath = this.getFilePath(file);

        if (filePath && fs.existsSync(filePath)) {
          const ext = path.extname(file.fileName);
          const sanitizedQuestionText = this.sanitizeFileName(questionText);
          const archiveFileName = questionFiles.length > 1
            ? `${sanitizedQuestionText}_${i + 1}${ext}`
            : `${sanitizedQuestionText}${ext}`;

          archive.file(filePath, { name: archiveFileName });
        }
      }
    }

    // Finalize archive
    await archive.finalize();

    // Wait for archive to finish
    await archivePromise;

    // Generate URL
    const url = `${this.baseUrl}/api/files/exports/${uniqueFileName}`;

    return {
      url,
      fileName,
      filePath
    };
  }

  private groupFilesByQuestion(files: FileInfo[]): Record<string, FileInfo[]> {
    const grouped: Record<string, FileInfo[]> = {};

    for (const file of files) {
      const key = file.questionId || 'no_question';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(file);
    }

    return grouped;
  }

  private findQuestion(step: StepInfo, questionId: string): any | null {
    return step.questions.find(q => q.id === questionId) || null;
  }

  private getFilePath(file: FileInfo): string | null {
    if (!file.localPath) return null;

    // If localPath is absolute, use it directly
    if (path.isAbsolute(file.localPath)) {
      return file.localPath;
    }

    // If relative, resolve from uploads directory
    const uploadsDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadsDir, file.localPath);
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }
}
