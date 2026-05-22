import { BaseDAO } from './baseDAO.js';
import type { ProductRow, ProductInsert, ProductUpdate } from '../types/database.js';

export class ProductDAO extends BaseDAO<ProductRow, ProductInsert, ProductUpdate> {
  constructor() {
    super('products');
  }
}
