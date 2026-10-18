import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.validation_email_required')
    .email('auth.validation_email_invalid'),
  password: z
    .string()
    .min(1, 'auth.validation_password_required')
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'auth.validation_fullname_required')
      .min(2, 'auth.validation_fullname_min')
      .max(100, 'auth.validation_fullname_max'),
    email: z
      .string()
      .trim()
      .min(1, 'auth.validation_email_required')
      .email('auth.validation_email_invalid'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[+0-9\s-]{8,20}$/.test(val),
        'auth.validation_phone_invalid'
      ),
    password: z
      .string()
      .min(1, 'auth.validation_password_required')
      .min(8, 'auth.validation_password_min')
      .max(128, 'auth.validation_password_max'),
    confirmPassword: z
      .string()
      .min(1, 'auth.validation_confirm_password_required'),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'auth.validation_terms_required')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.validation_passwords_mismatch',
    path: ['confirmPassword']
  });

export type SignupFormData = z.infer<typeof signupSchema>;
