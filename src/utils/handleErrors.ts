import { ZodError } from 'zod';
import { Response } from 'express';
import { AxiosError } from 'axios';

interface IHandleErrors {
  res: Response;
  error: unknown;
}

export const handleErrors = function ({ res, error }: IHandleErrors) {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  } else if (error instanceof AxiosError) {
    res.status(error.response?.status as number).json(error.response?.data);
  } else {
    res.status(500).json({ message: 'Internal Server Error', error: (error as any).message });
  }
};
