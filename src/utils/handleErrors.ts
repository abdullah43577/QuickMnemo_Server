import { ZodError } from 'zod';
import { Response } from 'express';

interface IHandleErrors {
  res: Response;
  error: any;
}

export const handleErrors = function ({ res, error }: IHandleErrors) {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  } else {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};
