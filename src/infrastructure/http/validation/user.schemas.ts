import { z } from 'zod';

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be less than 100 characters'),
  roleName: z
    .string()
    .min(1, 'Role name is required')
});

export const changeUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be less than 128 characters')
});

export const updateUserStatusSchema = z.object({
  status: z
    .enum(['ACTIVE', 'INACTIVE'], {
      errorMap: () => ({ message: 'Status must be either ACTIVE or INACTIVE' })
    })
});
