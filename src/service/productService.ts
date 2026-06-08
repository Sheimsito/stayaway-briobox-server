import { ProductDAO } from '../dao/productDAO.js';
import type { Paginated } from '../dao/baseDAO.js';
import type {
  ProductRow,
  ProductInsert,
  ProductUpdate,
  PaymentRow,
  PaymentSplitRow,
  CashRegisterMovementRow,
} from '../types/database.js';

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

  async delete(id: number): Promise<boolean> {
    await this.dao.updateById(id, { is_active: false } as ProductUpdate);
    return true;
  }

  /**
   * Sells a product: checks open cash session, decrements stock,
   * creates payment record and registers cash movement.
   * @param productId - Product to sell
   * @param quantity - Units to sell
   * @param sellerId - User ID processing the sale
   * @param paymentMethod - Payment method used
   */
  async sell(
    productId: number,
    quantity: number,
    sellerId: number,
    paymentMethod: string,
  ): Promise<{
    product: ProductRow;
    payment: PaymentRow;
    splits: PaymentSplitRow[];
    movement: CashRegisterMovementRow;
  }> {
    return this.dao.sellProduct(productId, quantity, sellerId, paymentMethod);
  }
}