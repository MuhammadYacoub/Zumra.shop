import { FastifyRequest, FastifyReply } from 'fastify';
import bwipjs from 'bwip-js';
import { CreateProductUseCase, CreateProductInput } from '../../../use-cases/catalog/CreateProductUseCase';
import { ListProductsUseCase } from '../../../use-cases/catalog/ListProductsUseCase';
import { MarTechEventBus } from '../../../infrastructure/marketing/MarTechEventBus';
import { Logger } from '../../../infrastructure/logging/logger';

export class CatalogController {
  private createUseCase = new CreateProductUseCase();
  private listUseCase = new ListProductsUseCase();
  private eventBus = MarTechEventBus.getInstance();

  async listProducts(request: FastifyRequest<{ Querystring: { category?: string; query?: string } }>, reply: FastifyReply) {
    try {
      const { category, query } = request.query || {};
      const products = await this.listUseCase.execute({ category, query });

      return reply.status(200).send({
        statusCode: 200,
        count: products.length,
        data: products.map(p => p.toJSON()),
        correlationId: request.correlationId,
      });
    } catch (err: any) {
      Logger.error(`ListProducts Error: ${err.message}`, { correlationId: request.correlationId });
      return reply.status(500).send({ statusCode: 500, error: err.message });
    }
  }

  async createProduct(request: FastifyRequest<{ Body: CreateProductInput }>, reply: FastifyReply) {
    try {
      const body = request.body;
      if (!body.nameAr || !body.category || !body.baseUnitPrice) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: nameAr, category, baseUnitPrice'
        });
      }

      const result = await this.createUseCase.execute(body, request.correlationId);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Product created and cataloged successfully',
        data: result.product.toJSON(),
        correlationId: request.correlationId,
      });
    } catch (err: any) {
      Logger.error(`CreateProduct Error: ${err.message}`, { correlationId: request.correlationId });
      return reply.status(500).send({ statusCode: 500, error: err.message });
    }
  }

  async renderBarcodeSvg(request: FastifyRequest<{ Querystring: { code?: string; type?: string } }>, reply: FastifyReply) {
    try {
      const code = request.query.code || '6221000982101';
      const type = request.query.type || 'code128';

      const svg = bwipjs.toSVG({
        bcid: type,
        text: code,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });

      return reply
        .type('image/svg+xml')
        .status(200)
        .send(svg);
    } catch (err: any) {
      Logger.error(`RenderBarcode Error: ${err.message}`, { correlationId: request.correlationId });
      return reply.status(500).send({ statusCode: 500, error: err.message });
    }
  }

  async getMarTechEvents(request: FastifyRequest, reply: FastifyReply) {
    const events = this.eventBus.getRecentEvents();
    return reply.status(200).send({
      statusCode: 200,
      count: events.length,
      data: events,
      correlationId: request.correlationId,
    });
  }
}
