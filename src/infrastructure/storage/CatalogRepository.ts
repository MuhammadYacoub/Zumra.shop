import { Product, ProductProps } from '../../domain/catalog/product.entity';

export class CatalogRepository {
  private static instance: CatalogRepository;
  private products: Map<string, Product> = new Map();

  private constructor() {
    this.seedInitialProducts();
  }

  public static getInstance(): CatalogRepository {
    if (!CatalogRepository.instance) {
      CatalogRepository.instance = new CatalogRepository();
    }
    return CatalogRepository.instance;
  }

  public async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  public async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  public async findBySku(sku: string): Promise<Product | null> {
    for (const p of this.products.values()) {
      if (p.sku === sku) return p;
    }
    return null;
  }

  public async findAll(filter?: { category?: string; query?: string }): Promise<Product[]> {
    let list = Array.from(this.products.values());

    if (filter?.category) {
      list = list.filter(p => p.category === filter.category);
    }

    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(p => 
        p.nameAr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.slangKeywords.some(k => k.toLowerCase().includes(q))
      );
    }

    return list;
  }

  private seedInitialProducts() {
    const seedItems: ProductProps[] = [
      {
        id: 'PROD-FGL-001',
        sku: 'ZMR-OFF-882190',
        barcode: '6221000982101',
        nameAr: 'كشكول سلك 80 ورقة فرز أول (غزل المحلة)',
        nameEn: 'Ghazal Wire Notebook 80 Sheets',
        category: 'أدوات مكتبية',
        marketOrigin: 'EL_FAGALA',
        packagingUnit: 'CARTON',
        unitsPerCarton: 40,
        baseUnitPrice: 25.0,
        stockQuantity: 500,
        slangKeywords: ['كشكول غزل', 'سلك 80', 'الحلوة', 'الفجالة سلك'],
        tieredPricing: [
          { minQuantity: 40, unitPrice: 22.0, discountPercentage: 12, labelAr: 'خصم الكرتونة (40 قطعة)' },
          { minQuantity: 200, unitPrice: 19.5, discountPercentage: 22, labelAr: 'جملة الجملة (5 كراتين)' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'PROD-ATB-002',
        sku: 'ZMR-PLA-771023',
        barcode: '6222000551029',
        nameAr: 'طقم أظرف بلاستيك بالإبزيم فرز أول - ألوان مشكلة',
        nameEn: 'Plastic Envelopes Assorted Colors',
        category: 'بلاستيكيات وتغليف',
        marketOrigin: 'EL_ATABA',
        packagingUnit: 'BUNDLE',
        unitsPerCarton: 100,
        baseUnitPrice: 8.5,
        stockQuantity: 1200,
        slangKeywords: ['أظرف بكبسولة', 'أظرف العتبة', 'ألوان مشكلة'],
        tieredPricing: [
          { minQuantity: 50, unitPrice: 7.2, discountPercentage: 15, labelAr: 'خصم الستة أربطة' },
          { minQuantity: 200, unitPrice: 6.0, discountPercentage: 29, labelAr: 'سعر كسر الكسر (طرد 200)' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'PROD-FGL-003',
        sku: 'ZMR-PEN-112094',
        barcode: '6221000112094',
        nameAr: 'قلم فسفوري ماركر ألماني أصلي (دستة 12 قلم)',
        nameEn: 'Highlighter Pen German Original',
        category: 'أدوات مكتبية',
        marketOrigin: 'EL_FAGALA',
        packagingUnit: 'DOZEN',
        unitsPerCarton: 12,
        baseUnitPrice: 15.0,
        stockQuantity: 800,
        slangKeywords: ['قلم فسفوري', 'ماركر الفجالة', 'دستة ماركر'],
        tieredPricing: [
          { minQuantity: 12, unitPrice: 13.0, discountPercentage: 13, labelAr: 'سعر الدستة' },
          { minQuantity: 120, unitPrice: 11.0, discountPercentage: 26, labelAr: 'سعر الكرتونة (10 دست)' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const item of seedItems) {
      this.products.set(item.id, new Product(item));
    }
  }
}
