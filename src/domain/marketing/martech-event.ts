export type MarTechEventType =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_VIEWED'
  | 'PRODUCT_SEARCHED'
  | 'CART_UPDATED'
  | 'ORDER_COMPLETED'
  | 'REBATE_EARNED';

export interface MarTechEventPayload {
  eventId: string;
  eventType: MarTechEventType;
  timestamp: string;
  correlationId?: string;
  merchantId?: string;
  productId?: string;
  data: Record<string, any>;
}

export interface IMarTechAdapter {
  name: string;
  dispatch(event: MarTechEventPayload): Promise<void>;
}
