import { IFleetRepository, Shipment } from '../../domain/fleet/fleet';
import { Logger } from '../../infrastructure/logging/logger';

export interface AssignShipmentInput {
  correlationId: string;
  shipmentId: string;
  driverId: string;
}

export class AssignShipmentUseCase {
  private static MAX_UNREMITTED_COD_EGP = 5000;

  constructor(private fleetRepo: IFleetRepository) {}

  async execute(input: AssignShipmentInput): Promise<Shipment> {
    const { correlationId, shipmentId, driverId } = input;

    Logger.info('Initiating shipment zonal dispatch assignment...', {
      correlationId,
      context: 'AssignShipmentUseCase',
      shipmentId,
      driverId,
    });

    const shipment = await this.fleetRepo.findShipmentById(shipmentId);
    if (!shipment) {
      const errMessage = `Shipment ID '${shipmentId}' not found.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase' });
      throw new Error(errMessage);
    }

    if (shipment.status !== 'PENDING') {
      const errMessage = `Cannot assign shipment '${shipmentId}'. Status is currently '${shipment.status}', expected 'PENDING'.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase' });
      throw new Error(errMessage);
    }

    const driver = await this.fleetRepo.findDriverById(driverId);
    if (!driver) {
      const errMessage = `Driver ID '${driverId}' not found.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase' });
      throw new Error(errMessage);
    }

    // Rule 1: Zonal Dispatch Lock
    if (driver.zoneId !== shipment.zoneId) {
      const errMessage = `Zonal Dispatch Lock Violation: Driver '${driverId}' is assigned to zone '${driver.zoneId}', but shipment '${shipmentId}' is in zone '${shipment.zoneId}'.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase', driverZone: driver.zoneId, shipmentZone: shipment.zoneId });
      throw new Error(errMessage);
    }

    // Rule 2: Driver Availability Lock
    if (driver.status !== 'AVAILABLE') {
      const errMessage = `Driver Availability Violation: Driver '${driverId}' status is currently '${driver.status}'. Must be 'AVAILABLE'.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase', driverStatus: driver.status });
      throw new Error(errMessage);
    }

    // Rule 3: COD Un-remitted Risk Limit (Farida's Logistics Constraint)
    const unremittedCOD = await this.fleetRepo.getDriverUnremittedCOD(driverId);
    if (unremittedCOD >= AssignShipmentUseCase.MAX_UNREMITTED_COD_EGP) {
      const errMessage = `COD Risk Limit Violation: Driver '${driverId}' holds ${unremittedCOD} EGP un-remitted cash, exceeding maximum threshold of ${AssignShipmentUseCase.MAX_UNREMITTED_COD_EGP} EGP. Dispatch blocked until COD remittance reconciliation is completed.`;
      Logger.error(errMessage, { correlationId, context: 'AssignShipmentUseCase', unremittedCOD, maxThreshold: AssignShipmentUseCase.MAX_UNREMITTED_COD_EGP });
      throw new Error(errMessage);
    }

    // Mutate state & persist
    shipment.driverId = driverId;
    shipment.status = 'ASSIGNED';
    shipment.attemptCount += 1;

    await this.fleetRepo.saveShipment(shipment);
    await this.fleetRepo.updateDriverStatus(driverId, 'ON_DELIVERY');

    Logger.info('Shipment assigned to zonal driver successfully.', {
      correlationId,
      context: 'AssignShipmentUseCase',
      shipmentId,
      driverId,
      zoneId: shipment.zoneId,
      codAmount: shipment.codAmount,
    });

    return shipment;
  }
}
