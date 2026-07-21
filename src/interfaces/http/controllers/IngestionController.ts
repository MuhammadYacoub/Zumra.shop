import { FastifyReply, FastifyRequest } from 'fastify';
import { ProcessVoiceOrderUseCase } from '../../../use-cases/ingestion/process-voice-order';
import { SQLiteIngestionRepository } from '../../../infrastructure/database/repositories/SQLiteIngestionRepository';

export interface ProcessVoiceOrderBody {
  merchantId: string;
  rawVoiceText: string;
}

export class IngestionController {
  private useCase: ProcessVoiceOrderUseCase;

  constructor() {
    const repo = new SQLiteIngestionRepository();
    this.useCase = new ProcessVoiceOrderUseCase(repo);
  }

  async processVoiceOrder(
    request: FastifyRequest<{ Body: ProcessVoiceOrderBody }>,
    reply: FastifyReply
  ): Promise<void> {
    const { merchantId, rawVoiceText } = request.body;
    const correlationId = request.correlationId;

    if (!merchantId || !rawVoiceText) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Fields "merchantId" and "rawVoiceText" are required.',
        correlationId,
      });
    }

    try {
      const result = await this.useCase.execute({
        correlationId,
        merchantId,
        rawVoiceText,
      });

      return reply.status(201).send({
        statusCode: 201,
        message: 'Voice order processed successfully',
        data: result,
        correlationId,
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: error.message,
        correlationId,
      });
    }
  }
}
