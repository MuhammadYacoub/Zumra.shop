import dotenv from 'dotenv';
dotenv.config();

import { buildApp } from './app';
import { Logger } from '../../infrastructure/logging/logger';
import { SQLiteConnection } from '../../infrastructure/database/sqlite-connection';

export async function startServer() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  const app = buildApp();

  try {
    // Verify DB connectivity
    SQLiteConnection.getDatabase();

    await app.listen({ port, host });
    Logger.info(`🚀 Zumra.shop Fastify Server listening on http://${host}:${port}`, {
      context: 'ServerBootstrap',
      swaggerUrl: `http://${host}:${port}/documentation`,
    });

    const shutdown = async (signal: string) => {
      Logger.info(`Received ${signal}. Shutting down gracefully...`, { context: 'ServerBootstrap' });
      await app.close();
      await SQLiteConnection.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error(`Server failed to start: ${error.message}`, { context: 'ServerBootstrap' });
    process.exit(1);
  }
}

// Invoke server startup
if (require.main === module || require.main?.filename.includes('index')) {
  startServer();
}
