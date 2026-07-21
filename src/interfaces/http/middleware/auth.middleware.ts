import { FastifyReply, FastifyRequest } from 'fastify';
import { SessionWhitelistService, UserTokenPayload } from '../../../infrastructure/security/SessionWhitelistService';
import { Logger } from '../../../infrastructure/logging/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserTokenPayload;
  }
}

export async function authenticateMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const correlationId = request.correlationId || 'SYS-AUTH';
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    Logger.warn('Unauthorized request missing Bearer Authorization header', {
      correlationId,
      context: 'AuthMiddleware',
      url: request.url,
    });
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or invalid Bearer Authorization header',
      correlationId,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const sessionService = SessionWhitelistService.getInstance();
    const userPayload = sessionService.verifyToken(token);
    
    // Attach verified user payload to Fastify request
    request.user = userPayload;
  } catch (err: unknown) {
    const error = err as Error;
    Logger.warn(`Authentication failed: ${error.message}`, {
      correlationId,
      context: 'AuthMiddleware',
      url: request.url,
    });
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
      correlationId,
    });
  }
}
