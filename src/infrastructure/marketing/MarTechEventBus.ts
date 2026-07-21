import { IMarTechAdapter, MarTechEventPayload } from '../../domain/marketing/martech-event';
import { Logger } from '../logging/logger';

export class MetaCapiAdapter implements IMarTechAdapter {
  name = 'Meta CAPI (Conversion API)';

  async dispatch(event: MarTechEventPayload): Promise<void> {
    Logger.info(`[MarTech] [Meta CAPI Adapter] Transmitted event: ${event.eventType}`, {
      context: 'MetaCapiAdapter',
      eventId: event.eventId,
      payload: event.data,
    });
  }
}

export class GoogleAnalytics4Adapter implements IMarTechAdapter {
  name = 'Google Analytics 4 (GA4 Protocol)';

  async dispatch(event: MarTechEventPayload): Promise<void> {
    Logger.info(`[MarTech] [GA4 Adapter] Streamed event: ${event.eventType}`, {
      context: 'GoogleAnalytics4Adapter',
      eventId: event.eventId,
      payload: event.data,
    });
  }
}

export class MarTechEventBus {
  private static instance: MarTechEventBus;
  private adapters: IMarTechAdapter[] = [];
  private eventHistory: MarTechEventPayload[] = [];

  private constructor() {
    this.adapters.push(new MetaCapiAdapter());
    this.adapters.push(new GoogleAnalytics4Adapter());
  }

  public static getInstance(): MarTechEventBus {
    if (!MarTechEventBus.instance) {
      MarTechEventBus.instance = new MarTechEventBus();
    }
    return MarTechEventBus.instance;
  }

  public registerAdapter(adapter: IMarTechAdapter) {
    this.adapters.push(adapter);
  }

  public async emit(event: Omit<MarTechEventPayload, 'eventId' | 'timestamp'>): Promise<MarTechEventPayload> {
    const fullEvent: MarTechEventPayload = {
      ...event,
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };

    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > 50) this.eventHistory.pop(); // Keep last 50 events for UI stream

    // Dispatch asynchronously to all registered adapters
    Promise.allSettled(
      this.adapters.map(adapter => adapter.dispatch(fullEvent))
    ).catch(err => {
      Logger.error(`[MarTechBus] Dispatch error: ${err.message}`, { context: 'MarTechEventBus' });
    });

    return fullEvent;
  }

  public getRecentEvents(): MarTechEventPayload[] {
    return this.eventHistory;
  }
}
