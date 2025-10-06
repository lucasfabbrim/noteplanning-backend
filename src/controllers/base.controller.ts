import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Base controller class - VERSÃO SIMPLIFICADA
 */
export abstract class BaseController {
  /**
   * Send success response
   */
  protected sendSuccess<T>(reply: FastifyReply, data: T, message = 'Success', statusCode = 200) {
    reply.code(statusCode);
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Send error response
   */
  protected sendError(reply: FastifyReply, message: string, statusCode = 400) {
    reply.code(statusCode);
    return {
      success: false,
      message,
    };
  }

  /**
   * Send created response
   */
  protected sendCreated<T>(reply: FastifyReply, data: T, message = 'Created successfully') {
    return this.sendSuccess(reply, data, message, 201);
  }

  /**
   * Handle service errors
   */
  protected handleServiceError(reply: FastifyReply, error: any) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.sendError(reply, message, 500);
  }

  /**
   * Get user from request
   */
  protected getUserFromRequest(request: FastifyRequest): any {
    return (request as any).user;
  }
}