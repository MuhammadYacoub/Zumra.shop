import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { correlationIdMiddleware } from './middleware/correlation-id.middleware';
import { authenticateMiddleware } from './middleware/auth.middleware';
import { IngestionController, ProcessVoiceOrderBody } from './controllers/IngestionController';
import { LedgerController, RecordLedgerEntryBody } from './controllers/LedgerController';
import { FleetController, AssignShipmentBody } from './controllers/FleetController';
import { CatalogController } from './controllers/CatalogController';
import { SessionWhitelistService } from '../../infrastructure/security/SessionWhitelistService';
import { Logger } from '../../infrastructure/logging/logger';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false, // Managed via custom structured Logger
  });

  // 1. CORS
  app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // 2. Static File Serving for Frontend Web App
  app.register(fastifyStatic, {
    root: path.join(__dirname, '../../../public'),
    prefix: '/', // Serves index.html at http://localhost:3000/
  });

  // 3. OpenAPI / Swagger Documentation
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Zumra.shop (زُمرة) B2B Trade & Catalog Engine API',
        description: 'Smart E-commerce REST Engine for Traditional Egyptian Wholesale Markets (El-Ataba, El-Fagala).',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local Development Server' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // 4. Global onRequest Hooks
  app.addHook('onRequest', correlationIdMiddleware);

  // Controllers
  const ingestionCtrl = new IngestionController();
  const ledgerCtrl = new LedgerController();
  const fleetCtrl = new FleetController();
  const catalogCtrl = new CatalogController();

  // --------------------------------------------------------------------------
  // PUBLIC ROUTES
  // --------------------------------------------------------------------------
  app.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'UP',
      system: 'Zumra.shop Trade Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: request.correlationId,
    });
  });

  // Public Catalog & Barcode Endpoints (for Frontend Dashboard & Mobile)
  app.get('/api/v1/catalog/products', async (req: any, res) => {
    await catalogCtrl.listProducts(req, res);
  });

  app.post('/api/v1/catalog/products', async (req: any, res) => {
    await catalogCtrl.createProduct(req, res);
  });

  app.get('/api/v1/catalog/barcode', async (req: any, res) => {
    await catalogCtrl.renderBarcodeSvg(req, res);
  });

  app.get('/api/v1/marketing/events', async (req: any, res) => {
    await catalogCtrl.getMarTechEvents(req, res);
  });

  // Auth helper endpoint for obtaining test Bearer tokens
  app.post<{ Body: { userId?: string; role?: string; phone?: string } }>('/api/v1/auth/login', async (request, reply) => {
    const { userId = 'USER-ADMIN-01', role = 'ADMIN', phone = '+201000000000' } = request.body || {};
    const sessionService = SessionWhitelistService.getInstance();
    const tokenData = sessionService.generateToken({ userId, role, phone });

    return reply.status(200).send({
      statusCode: 200,
      message: 'Authentication successful',
      data: {
        token: tokenData.token,
        tokenType: 'Bearer',
        sessionId: tokenData.sessionId,
        user: { userId, role, phone },
      },
      correlationId: request.correlationId,
    });
  });

  // --------------------------------------------------------------------------
  // SECURED DOMAIN ROUTES (Requires JWT Bearer + Session Whitelist)
  // --------------------------------------------------------------------------
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateMiddleware);

    // Voice Ingestion Endpoint
    protectedRoutes.post<{ Body: ProcessVoiceOrderBody }>('/api/v1/ingestion/voice-order', async (req, res) => {
      await ingestionCtrl.processVoiceOrder(req, res);
    });

    // Ledger Postings Endpoint
    protectedRoutes.post<{ Body: RecordLedgerEntryBody }>('/api/v1/ledger/entries', async (req, res) => {
      await ledgerCtrl.recordEntry(req, res);
    });

    // Fleet Dispatch Endpoint
    protectedRoutes.post<{ Body: AssignShipmentBody }>('/api/v1/fleet/dispatch', async (req, res) => {
      await fleetCtrl.assignShipment(req, res);
    });
  });

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    Logger.error(`Unhandled Fastify Exception: ${error.message}`, {
      correlationId: request.correlationId,
      context: 'FastifyGlobalErrorHandler',
      stack: error.stack,
    });

    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message,
      correlationId: request.correlationId,
    });
  });

  return app;
}
