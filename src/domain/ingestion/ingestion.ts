export type WholesaleUnit = 'DOZEN' | 'BATCH' | 'LOT' | 'PIECE';

export interface WholesaleItem {
  nameAr: string;
  unit: WholesaleUnit;
  unitArabicTerm: string;
  quantity: number;
  estimatedUnitPriceEgp: number;
}

export interface VoiceIngestedOrder {
  id: string;
  merchantId: string;
  rawVoiceText: string;
  parsedItems: WholesaleItem[];
  totalEstimatedAmountEgp: number;
  arabicSeoSlug: string;
  createdAt?: string;
}

export interface IIngestionRepository {
  saveIngestedOrder(order: VoiceIngestedOrder): Promise<void>;
  getIngestedOrderById(id: string): Promise<VoiceIngestedOrder | null>;
}
