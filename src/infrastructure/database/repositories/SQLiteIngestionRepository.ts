import { IIngestionRepository, VoiceIngestedOrder } from '../../../domain/ingestion/ingestion';
import { SQLiteConnection } from '../sqlite-connection';

export class SQLiteIngestionRepository implements IIngestionRepository {
  private inMemoryStore: Map<string, VoiceIngestedOrder> = new Map();

  async saveIngestedOrder(order: VoiceIngestedOrder): Promise<void> {
    this.inMemoryStore.set(order.id, order);

    await SQLiteConnection.execute(
      `INSERT INTO journal_entries (id, correlation_id, reference_type, reference_id, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `ING-LOG-${order.id}`,
        `CORR-ING-${order.id}`,
        'SYSTEM_ADJUSTMENT',
        order.id,
        `Ingested voice order for merchant ${order.merchantId}: ${order.arabicSeoSlug}`,
        'POSTED',
      ]
    ).catch(() => {
      // Non-blocking log persistence if table exists
    });
  }

  async getIngestedOrderById(id: string): Promise<VoiceIngestedOrder | null> {
    return this.inMemoryStore.get(id) || null;
  }
}
