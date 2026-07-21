import { FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from '../../../infrastructure/logging/logger';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

export async function correlationIdMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const headerName = (process.env.CORRELATION_HEADER || 'x-correlation-id').toLowerCase();
  
  const rawHeader = request.headers[headerName];
  const correlationId = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) || 
                        `CORR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Attach correlation ID to request object and response header
  request.correlationId = correlationId;
  reply.header(headerName, correlationId);

  Logger.debug(`Extracted correlation ID: ${correlationId}`, {
    correlationId,
    context: 'CorrelationIdMiddleware',
    method: request.method,
    url: request.url,
  });
}
