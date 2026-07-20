import { IIngestionRepository, VoiceIngestedOrder, WholesaleItem, WholesaleUnit } from '../../domain/ingestion/ingestion';
import { Logger } from '../../infrastructure/logging/logger';

export interface ProcessVoiceOrderInput {
  correlationId: string;
  merchantId: string;
  rawVoiceText: string;
}

export class ProcessVoiceOrderUseCase {
  constructor(private ingestionRepo: IIngestionRepository) {}

  async execute(input: ProcessVoiceOrderInput): Promise<VoiceIngestedOrder> {
    const { correlationId, merchantId, rawVoiceText } = input;

    Logger.info('Processing Egyptian wholesale voice-to-JSON payload...', {
      correlationId,
      context: 'ProcessVoiceOrderUseCase',
      merchantId,
      rawVoiceText,
    });

    if (!rawVoiceText || rawVoiceText.trim().length === 0) {
      throw new Error('Voice transcript payload cannot be empty.');
    }

    const parsedItems = this.parseEgyptianWholesaleUnits(rawVoiceText);
    const totalEstimatedAmountEgp = parsedItems.reduce(
      (sum, item) => sum + item.quantity * item.estimatedUnitPriceEgp,
      0
    );

    const arabicSeoSlug = this.generateArabicSeoSlug(rawVoiceText, parsedItems);

    const ingestedOrder: VoiceIngestedOrder = {
      id: `VOICE-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      merchantId,
      rawVoiceText,
      parsedItems,
      totalEstimatedAmountEgp,
      arabicSeoSlug,
      createdAt: new Date().toISOString(),
    };

    await this.ingestionRepo.saveIngestedOrder(ingestedOrder);

    Logger.info('Voice order successfully parsed and stored.', {
      correlationId,
      context: 'ProcessVoiceOrderUseCase',
      orderId: ingestedOrder.id,
      itemCount: parsedItems.length,
      totalEstimatedAmountEgp,
      arabicSeoSlug,
    });

    return ingestedOrder;
  }

  /**
   * Nour's Egyptian Wholesale Slang & Unit Parser Rule:
   * Recognizes:
   * - "دستة" / "دسته" -> DOZEN (Multipliers of 12)
   * - "كرتونة" / "كرتونه" -> BATCH (Multipliers of 24)
   * - "شكارة" / "طن" -> LOT (Wholesale Bulk Lots)
   * - Default -> PIECE
   */
  private parseEgyptianWholesaleUnits(text: string): WholesaleItem[] {
    const items: WholesaleItem[] = [];

    // Simple regex parser for demonstration & integration testing
    const patterns = [
      { regex: /(\d+)\s*(دسته|دستة)\s*([^\d,]+)/gi, unit: 'DOZEN' as WholesaleUnit, term: 'دستة', multiplier: 12, defaultPrice: 150 },
      { regex: /(\d+)\s*(كرتونه|كرتونة)\s*([^\d,]+)/gi, unit: 'BATCH' as WholesaleUnit, term: 'كرتونة', multiplier: 24, defaultPrice: 400 },
      { regex: /(\d+)\s*(شكارة|شكاره|طن)\s*([^\d,]+)/gi, unit: 'LOT' as WholesaleUnit, term: 'شكارة', multiplier: 50, defaultPrice: 1200 },
      { regex: /(\d+)\s*(قطعة|قطعه|علبة)\s*([^\d,]+)/gi, unit: 'PIECE' as WholesaleUnit, term: 'قطعة', multiplier: 1, defaultPrice: 25 },
    ];

    let matched = false;

    for (const p of patterns) {
      let match;
      while ((match = p.regex.exec(text)) !== null) {
        matched = true;
        const qty = parseInt(match[1], 10);
        const nameAr = match[3].trim();

        items.push({
          nameAr,
          unit: p.unit,
          unitArabicTerm: p.term,
          quantity: qty,
          estimatedUnitPriceEgp: p.defaultPrice,
        });
      }
    }

    // Fallback if no specific quantity pattern matched
    if (!matched) {
      items.push({
        nameAr: text.trim(),
        unit: 'PIECE',
        unitArabicTerm: 'قطعة',
        quantity: 1,
        estimatedUnitPriceEgp: 100,
      });
    }

    return items;
  }

  /**
   * Nour's Arabic SEO Slug Generator:
   * Converts Egyptian voice transcripts into clean, indexable URL slugs.
   */
  private generateArabicSeoSlug(text: string, items: WholesaleItem[]): string {
    const cleanText = text
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-');

    const primaryItem = items[0] ? items[0].nameAr.replace(/\s+/g, '-') : 'gomla';
    return `${cleanText}-بضاعة-العتبة-جملة-${primaryItem}`;
  }
}
