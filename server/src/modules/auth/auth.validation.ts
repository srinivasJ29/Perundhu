import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(128, { message: 'Password cannot exceed 128 characters' }),
    fullName: z
      .string()
      .min(2, { message: 'Full name must be at least 2 characters long' })
      .max(100, { message: 'Full name cannot exceed 100 characters' })
      .trim(),
    phone: z
      .string()
      .regex(/^[+0-9\s-]{8,20}$/, { message: 'Invalid phone number format' })
      .optional()
  })
};

export const loginSchema = {
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email address format' })
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(1, { message: 'Password is required' })
  })
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1).optional()
  })
};
