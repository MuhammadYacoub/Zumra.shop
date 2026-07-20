export type DriverStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY';
export type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED' | 'RETURNED';
export type VehicleType = 'MOTORCYCLE' | 'TRICYCLE' | 'VAN' | 'PICKUP';

export interface Zone {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  marketType: 'EL_ATABA' | 'EL_FAGALA' | 'CUSTOM';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Driver {
  id: string;
  userId: string;
  zoneId: string;
  vehicleType: VehicleType;
  phone: string;
  status: DriverStatus;
  currentLat?: number;
  currentLng?: number;
  unremittedCodBalance?: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  driverId?: string;
  zoneId: string;
  status: ShipmentStatus;
  codAmount: number;
  failedReason?: string;
  attemptCount: number;
  deliveredAt?: string;
  createdAt?: string;
}

export interface IFleetRepository {
  findDriverById(id: string): Promise<Driver | null>;
  findShipmentById(id: string): Promise<Shipment | null>;
  findZoneById(id: string): Promise<Zone | null>;
  getDriverUnremittedCOD(driverId: string): Promise<number>;
  saveShipment(shipment: Shipment): Promise<void>;
  updateDriverStatus(driverId: string, status: DriverStatus): Promise<void>;
}
