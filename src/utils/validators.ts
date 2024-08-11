import { z } from 'zod';

export const authValidator = z.object({
  email: z.string().email({ message: 'Email is required!' }),
  password: z.string({ message: 'Password is required!' }).min(8, { message: 'Password is too short' }),
});

export const logoutValidator = z.object({
  refreshToken: z.string({ message: 'Refresh Token is required!' }),
});

export const savedMnemonicsSchema = z.object({
  savedMnemonics: z.string({ message: 'Expected Data: Array of strings = saved mnemonics' }).array(),
});
