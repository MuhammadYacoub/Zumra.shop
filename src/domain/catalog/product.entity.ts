export type PackagingUnit = 'PIECE' | 'DOZEN' | 'BUNDLE' | 'CARTON' | 'PARCEL';

export interface TieredPrice {
  minQuantity: number;
  unitPrice: number;
  discountPercentage: number;
  labelAr: string; // e.g. "جملة الجملة (5 كراتين فأكثر)"
}

export interface ProductProps {
  id: string;
  sku: string; // GS1 or ZUMRA internal SKU
  barcode: string; // EAN-13, UPC, or generated Barcode string
  nameAr: string; // e.g. "كشكول سلك 80 ورقة - زياد"
  nameEn?: string;
  category: string; // e.g. "أدوات مكتبية"
  marketOrigin: 'EL_FAGALA' | 'EL_ATABA' | 'DIRECT_FACTORY';
  packagingUnit: PackagingUnit;
  unitsPerCarton: number;
  baseUnitPrice: number; // Single unit base price in EGP
  tieredPricing: TieredPrice[];
  stockQuantity: number;
  slangKeywords: string[]; // e.g. ["كشكول غزل", "سلك 80", "الحلوة"]
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private props: ProductProps;

  constructor(props: ProductProps) {
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get sku(): string { return this.props.sku; }
  public get barcode(): string { return this.props.barcode; }
  public get nameAr(): string { return this.props.nameAr; }
  public get category(): string { return this.props.category; }
  public get marketOrigin(): string { return this.props.marketOrigin; }
  public get packagingUnit(): PackagingUnit { return this.props.packagingUnit; }
  public get baseUnitPrice(): number { return this.props.baseUnitPrice; }
  public get stockQuantity(): number { return this.props.stockQuantity; }
  public get tieredPricing(): TieredPrice[] { return this.props.tieredPricing; }
  public get slangKeywords(): string[] { return this.props.slangKeywords; }

  /**
   * Calculates effective price per unit based on quantity requested
   */
  public calculateEffectivePrice(quantity: number): { unitPrice: number; totalPrice: number; appliedTier?: TieredPrice } {
    let appliedTier: TieredPrice | undefined;
    
    // Sort tiers descending by minQuantity
    const sortedTiers = [...this.props.tieredPricing].sort((a, b) => b.minQuantity - a.minQuantity);
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        appliedTier = tier;
        break;
      }
    }

    const unitPrice = appliedTier ? appliedTier.unitPrice : this.props.baseUnitPrice;
    const totalPrice = Math.round((unitPrice * quantity) * 100) / 100;

    return {
      unitPrice,
      totalPrice,
      appliedTier,
    };
  }

  /**
   * Helper to generate a ZUMRA Internal SKU if GS1 is missing
   */
  public static generateInternalSku(categoryCode: string): string {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    const prefix = categoryCode.slice(0, 3).toUpperCase();
    return `ZMR-${prefix}-${randomHex}`;
  }

  public toJSON(): ProductProps {
    return { ...this.props };
  }
}
