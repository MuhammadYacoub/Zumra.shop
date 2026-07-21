import { Product, PackagingUnit, TieredPrice } from '../../domain/catalog/product.entity';
import { CatalogRepository } from '../../infrastructure/storage/CatalogRepository';
import { MarTechEventBus } from '../../infrastructure/marketing/MarTechEventBus';
import { Logger } from '../../infrastructure/logging/logger';

export interface CreateProductInput {
  sku?: string;
  barcode?: string;
  nameAr: string;
  nameEn?: string;
  category: string;
  marketOrigin: 'EL_FAGALA' | 'EL_ATABA' | 'DIRECT_FACTORY';
  packagingUnit: PackagingUnit;
  unitsPerCarton: number;
  baseUnitPrice: number;
  stockQuantity: number;
  slangKeywords?: string[];
  tieredPricing?: TieredPrice[];
}

export class CreateProductUseCase {
  private repo = CatalogRepository.getInstance();
  private eventBus = MarTechEventBus.getInstance();

  async execute(input: CreateProductInput, correlationId?: string): Promise<{ product: Product; barcodeSvg?: string }> {
    const categoryCode = input.category.substring(0, 3).toUpperCase();
    const finalSku = input.sku || Product.generateInternalSku(categoryCode);
    const finalBarcode = input.barcode || `622${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const id = `PROD-${input.marketOrigin.slice(0, 3)}-${Date.now()}`;

    // Calculate default tiers if not provided
    const tieredPricing: TieredPrice[] = input.tieredPricing || [
      {
        minQuantity: input.unitsPerCarton || 10,
        unitPrice: Math.round(input.baseUnitPrice * 0.88 * 100) / 100,
        discountPercentage: 12,
        labelAr: `خصم الـ ${input.packagingUnit} (12%)`
      },
      {
        minQuantity: (input.unitsPerCarton || 10) * 5,
        unitPrice: Math.round(input.baseUnitPrice * 0.78 * 100) / 100,
        discountPercentage: 22,
        labelAr: 'جملة الجملة (5 كراتين فأكثر)'
      }
    ];

    const product = new Product({
      id,
      sku: finalSku,
      barcode: finalBarcode,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      category: input.category,
      marketOrigin: input.marketOrigin,
      packagingUnit: input.packagingUnit,
      unitsPerCarton: input.unitsPerCarton || 1,
      baseUnitPrice: input.baseUnitPrice,
      stockQuantity: input.stockQuantity,
      slangKeywords: input.slangKeywords || [],
      tieredPricing,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.repo.save(product);

    Logger.info(`[Catalog] Product created: ${product.nameAr} (${product.sku})`, {
      context: 'CreateProductUseCase',
      correlationId,
      productId: product.id,
    });

    // Emit MarTech Event
    await this.eventBus.emit({
      eventType: 'PRODUCT_CREATED',
      correlationId,
      productId: product.id,
      data: {
        sku: product.sku,
        barcode: product.barcode,
        nameAr: product.nameAr,
        category: product.category,
        baseUnitPrice: product.baseUnitPrice,
        stockQuantity: product.stockQuantity,
      }
    });

    return { product };
  }
}
