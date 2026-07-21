import { FastifyReply, FastifyRequest } from 'fastify';
import { AssignShipmentUseCase } from '../../../use-cases/fleet/assign-shipment';
import { SQLiteFleetRepository } from '../../../infrastructure/database/repositories/SQLiteFleetRepository';

export interface AssignShipmentBody {
  shipmentId: string;
  driverId: string;
}

export class FleetController {
  private useCase: AssignShipmentUseCase;

  constructor() {
    const repo = new SQLiteFleetRepository();
    this.useCase = new AssignShipmentUseCase(repo);
  }

  async assignShipment(
    request: FastifyRequest<{ Body: AssignShipmentBody }>,
    reply: FastifyReply
  ): Promise<void> {
    const { shipmentId, driverId } = request.body;
    const correlationId = request.correlationId;

    if (!shipmentId || !driverId) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Fields "shipmentId" and "driverId" are required.',
        correlationId,
      });
    }

    try {
      const result = await this.useCase.execute({
        correlationId,
        shipmentId,
        driverId,
      });

      return reply.status(200).send({
        statusCode: 200,
        message: 'Shipment assigned to zonal driver successfully',
        data: result,
        correlationId,
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity / Dispatch Lock',
        message: error.message,
        correlationId,
      });
    }
  }
}
