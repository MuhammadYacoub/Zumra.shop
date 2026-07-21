import { FastifyReply, FastifyRequest } from 'fastify';
import { RecordLedgerEntryUseCase } from '../../../use-cases/ledger/record-entry';
import { SQLiteLedgerRepository } from '../../../infrastructure/database/repositories/SQLiteLedgerRepository';
import { EntryType, ReferenceType } from '../../../domain/ledger/ledger';

export interface RecordLedgerEntryBody {
  referenceType: ReferenceType;
  referenceId: string;
  description: string;
  lines: Array<{
    accountCode: string;
    entryType: EntryType;
    amount: number;
    currency?: string;
  }>;
}

export class LedgerController {
  private useCase: RecordLedgerEntryUseCase;

  constructor() {
    const repo = new SQLiteLedgerRepository();
    this.useCase = new RecordLedgerEntryUseCase(repo);
  }

  async recordEntry(
    request: FastifyRequest<{ Body: RecordLedgerEntryBody }>,
    reply: FastifyReply
  ): Promise<void> {
    const { referenceType, referenceId, description, lines } = request.body;
    const correlationId = request.correlationId;

    if (!referenceType || !referenceId || !description || !lines) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Fields "referenceType", "referenceId", "description", and "lines" are required.',
        correlationId,
      });
    }

    try {
      const result = await this.useCase.execute({
        correlationId,
        referenceType,
        referenceId,
        description,
        lines,
      });

      return reply.status(201).send({
        statusCode: 201,
        message: 'Double-entry transaction posted successfully',
        data: result,
        correlationId,
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request / Domain Violation',
        message: error.message,
        correlationId,
      });
    }
  }
}
