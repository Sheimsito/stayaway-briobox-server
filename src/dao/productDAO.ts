import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import { BaseDAO } from './baseDAO.js';
import type { ProductRow, ProductInsert, ProductUpdate } from '../types/database.js';

export class ProductDAO extends BaseDAO<ProductRow, ProductInsert, ProductUpdate> {
  constructor() {
    super('products');
  }

  /**
   * Decrements product stock atomically after verifying sufficient quantity exists.
   * @param productId - The ID of the product to sell
   * @param quantity - Number of units to subtract from stock
   * @returns Updated product row
   */
  async sellProduct(productId: number, quantity: number): Promise<ProductRow> {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (fetchError || !product) {
      throw new Error('Producto no encontrado o inactivo');
    }

    if (product.stock < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
    }

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return updated as ProductRow;
  }
}