import { z } from 'zod';

export const createSubmissionSchema = z.object({
  formId: z
    .string()
    .uuid('Invalid form ID format'),
  userId: z
    .string()
    .uuid('Invalid user ID format'),
  metadata: z
    .record(z.any())
    .optional()
});

export const updateSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid('Invalid question ID format'),
    answerText: z.string().optional(),
    answerValue: z.array(z.string()).optional()
  })).optional(),
  metadata: z
    .record(z.any())
    .optional()
});

export const listSubmissionsSchema = z.object({
  formId: z.string().uuid('Invalid form ID format').optional(),
  userId: z.string().uuid('Invalid user ID format').optional()
});
