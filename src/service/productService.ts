import { ProductDAO } from '../dao/productDAO.js';
import type { Paginated } from '../dao/baseDAO.js';
import type { ProductRow, ProductInsert, ProductUpdate } from '../types/database.js';

export class ProductService {
  private dao = new ProductDAO();

  async create(data: ProductInsert): Promise<ProductRow> {
    return this.dao.create(data);
  }

  async getAll(page: number = 1, limit: number = 10): Promise<Paginated<ProductRow>> {
    const offset = (page - 1) * limit;
    return this.dao.list({ limit, offset });
  }

  async getById(id: number): Promise<ProductRow> {
    return this.dao.findById(id);
  }

  async update(id: number, data: ProductUpdate): Promise<ProductRow> {
    return this.dao.updateById(id, data);
  }

  // Soft delete: set is_active to false
  async delete(id: number): Promise<boolean> {
    await this.dao.updateById(id, { is_active: false } as ProductUpdate);
    return true;
  }
}
