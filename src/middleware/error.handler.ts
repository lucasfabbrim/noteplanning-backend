import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@/errors';
import { logger } from '@/config';

/**
 * Global error handler middleware
 */
export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
  }, 'Request error');

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    const zodError = error as any;
    details = zodError.errors?.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if ((error as any).validation) {
    statusCode = 400;
    message = 'Validation error';
    details = (error as any).validation;
  } else if ((error as any).statusCode) {
    statusCode = (error as any).statusCode;
    message = (error as any).message;
  }

  // Send error response
  const response: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return reply.status(statusCode).send(response);
}
