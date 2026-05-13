import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaCode = String((error as { code?: unknown }).code ?? '');
    if (prismaCode === 'P2002') {
      return res.status(409).json({ message: 'A record with the same unique value already exists' });
    }

    if (prismaCode === 'P2025') {
      return res.status(404).json({ message: 'Requested record was not found' });
    }
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};
