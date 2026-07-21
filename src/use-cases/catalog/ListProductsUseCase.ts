import { CatalogRepository } from '../../infrastructure/storage/CatalogRepository';
import { Product } from '../../domain/catalog/product.entity';

export interface ListProductsInput {
  category?: string;
  query?: string;
}

export class ListProductsUseCase {
  private repo = CatalogRepository.getInstance();

  async execute(input: ListProductsInput): Promise<Product[]> {
    return this.repo.findAll({
      category: input.category,
      query: input.query
    });
  }
}
