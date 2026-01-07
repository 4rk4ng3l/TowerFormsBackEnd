import { z } from 'zod';

const syncFileSchema = z.object({
  id: z.string().uuid(),
  stepId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  fileData: z.string(), // Base64 encoded
  mimeType: z.string(),
  fileSize: z.number().positive()
});

const syncAnswerSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  answerText: z.string().optional(),
  answerValue: z.array(z.string()).optional()
});

const syncSubmissionSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  userId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  answers: z.array(syncAnswerSchema),
  files: z.array(syncFileSchema)
});

export const syncSubmissionsSchema = z.object({
  submissions: z.array(syncSubmissionSchema).min(1, 'At least one submission is required')
});

export const getPendingSyncDataSchema = z.object({
  userId: z.string().uuid().optional(),
  lastSyncDate: z.string().datetime().optional()
});
