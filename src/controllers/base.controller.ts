import { FastifyRequest, FastifyReply } from 'fastify';

export abstract class BaseController {
  protected sendSuccess<T>(reply: FastifyReply, data: T, message = 'Success', statusCode = 200) {
    reply.code(statusCode);
    return {
      success: true,
      message,
      data,
    };
  }

  protected sendError(reply: FastifyReply, message: string, statusCode = 400) {
    reply.code(statusCode);
    return {
      success: false,
      message,
    };
  }

  protected sendCreated<T>(reply: FastifyReply, data: T, message = 'Created successfully') {
    return this.sendSuccess(reply, data, message, 201);
  }

  protected handleServiceError(reply: FastifyReply, error: any) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.sendError(reply, message, 500);
  }

  protected getUserFromRequest(request: FastifyRequest): any {
    return (request as any).user;
  }
}