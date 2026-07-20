import { Driver, DriverStatus, IFleetRepository, Shipment, Zone } from '../../../domain/fleet/fleet';
import { SQLiteConnection } from '../sqlite-connection';

interface DriverRow {
  id: string;
  user_id: string;
  zone_id: string;
  vehicle_type: 'MOTORCYCLE' | 'TRICYCLE' | 'VAN' | 'PICKUP';
  phone: string;
  status: DriverStatus;
  current_lat?: number;
  current_lng?: number;
}

interface ShipmentRow {
  id: string;
  order_id: string;
  driver_id?: string;
  zone_id: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  cod_amount: number;
  failed_reason?: string;
  attempt_count: number;
  delivered_at?: string;
  created_at: string;
}

interface ZoneRow {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  market_type: 'EL_ATABA' | 'EL_FAGALA' | 'CUSTOM';
  status: 'ACTIVE' | 'INACTIVE';
}

export class SQLiteFleetRepository implements IFleetRepository {
  async findDriverById(id: string): Promise<Driver | null> {
    const rows = await SQLiteConnection.query<DriverRow>(
      'SELECT id, user_id, zone_id, vehicle_type, phone, status, current_lat, current_lng FROM drivers WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];

    const unremittedCodBalance = await this.getDriverUnremittedCOD(id);

    return {
      id: row.id,
      userId: row.user_id,
      zoneId: row.zone_id,
      vehicleType: row.vehicle_type,
      phone: row.phone,
      status: row.status,
      currentLat: row.current_lat ? Number(row.current_lat) : undefined,
      currentLng: row.current_lng ? Number(row.current_lng) : undefined,
      unremittedCodBalance,
    };
  }

  async findShipmentById(id: string): Promise<Shipment | null> {
    const rows = await SQLiteConnection.query<ShipmentRow>(
      'SELECT id, order_id, driver_id, zone_id, status, cod_amount, failed_reason, attempt_count, delivered_at, created_at FROM shipments WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      orderId: row.order_id,
      driverId: row.driver_id || undefined,
      zoneId: row.zone_id,
      status: row.status,
      codAmount: Number(row.cod_amount),
      failedReason: row.failed_reason || undefined,
      attemptCount: Number(row.attempt_count),
      deliveredAt: row.delivered_at || undefined,
      createdAt: row.created_at,
    };
  }

  async findZoneById(id: string): Promise<Zone | null> {
    const rows = await SQLiteConnection.query<ZoneRow>(
      'SELECT id, code, name_ar, name_en, market_type, status FROM zones WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      marketType: row.market_type,
      status: row.status,
    };
  }

  async getDriverUnremittedCOD(driverId: string): Promise<number> {
    const rows = await SQLiteConnection.query<{ total: number }>(
      `SELECT SUM(cod_amount) as total
       FROM shipments
       WHERE driver_id = ? AND status = 'DELIVERED'`,
      [driverId]
    );

    const totalDeliveredCOD = rows[0]?.total ? Number(rows[0].total) : 0;

    const reconRows = await SQLiteConnection.query<{ total: number }>(
      `SELECT SUM(total_remitted) as total
       FROM cod_reconciliations
       WHERE driver_id = ? AND status = 'MATCHED'`,
      [driverId]
    );

    const totalRemitted = reconRows[0]?.total ? Number(reconRows[0].total) : 0;

    return Math.max(0, totalDeliveredCOD - totalRemitted);
  }

  async saveShipment(shipment: Shipment): Promise<void> {
    const existing = await this.findShipmentById(shipment.id);
    if (existing) {
      await SQLiteConnection.execute(
        `UPDATE shipments
         SET driver_id = ?, status = ?, cod_amount = ?, failed_reason = ?, attempt_count = ?, delivered_at = ?
         WHERE id = ?`,
        [
          shipment.driverId || null,
          shipment.status,
          shipment.codAmount,
          shipment.failedReason || null,
          shipment.attemptCount,
          shipment.deliveredAt || null,
          shipment.id,
        ]
      );
    } else {
      await SQLiteConnection.execute(
        `INSERT INTO shipments (id, order_id, driver_id, zone_id, status, cod_amount, failed_reason, attempt_count, delivered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipment.id,
          shipment.orderId,
          shipment.driverId || null,
          shipment.zoneId,
          shipment.status,
          shipment.codAmount,
          shipment.failedReason || null,
          shipment.attemptCount,
          shipment.deliveredAt || null,
        ]
      );
    }
  }

  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
    await SQLiteConnection.execute('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
  }
}
