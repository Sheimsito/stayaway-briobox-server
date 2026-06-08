import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import { BaseDAO } from './baseDAO.js';
import type {
  ProductRow,
  ProductInsert,
  ProductUpdate,
  PaymentInsert,
  PaymentRow,
  PaymentSplitInsert,
  PaymentSplitRow,
  CashRegisterMovementInsert,
  CashRegisterMovementRow,
} from '../types/database.js';

export class ProductDAO extends BaseDAO<ProductRow, ProductInsert, ProductUpdate> {
  constructor() {
    super('products');
  }

  /**
   * Sells a product: verifies open cash session, decrements stock,
   * creates a payment with splits, and registers a cash movement.
   * @param productId - Product to sell
   * @param quantity - Units to sell
   * @param sellerId - User processing the sale
   * @param paymentMethod - Payment method (e.g. 'efectivo', 'transferencia')
   * @returns Object with updated product, payment, splits and cash movement
   */
  async sellProduct(
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
    const { data: session, error: sessionError } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .is('closed_at', null)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) throw new Error(sessionError.message);
    if (!session) throw new Error('No hay una sesión de caja abierta.');

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) throw new Error('Producto no encontrado o inactivo.');
    if (product.stock < quantity) throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);

    const { data: updatedProduct, error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();

    if (stockError) throw new Error(stockError.message);

    const totalAmount = product.price * quantity;

    const paymentPayload: PaymentInsert = {
      created_by: sellerId,
      customer_id: null,
      total_amount: totalAmount,
      reference_type: 'product',
      reference_id: productId,
      notes: `Venta de ${quantity} x ${product.name}`,
    };

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentPayload] as any)
      .select('*')
      .single();

    if (paymentError) throw new Error(paymentError.message);
    const payment = paymentData as PaymentRow;

    const splitPayload: PaymentSplitInsert = {
      payment_id: payment.id,
      payment_method: paymentMethod,
      amount: totalAmount,
    };

    const { data: splitsData, error: splitsError } = await supabase
      .from('payment_splits')
      .insert([splitPayload] as any)
      .select('*');

    if (splitsError) throw new Error(splitsError.message);

    const movementPayload: CashRegisterMovementInsert = {
      session_id: session.id,
      created_by: sellerId,
      movement_type: 'income',
      amount: totalAmount,
      description: `Venta de producto: ${quantity} x ${product.name}`,
      reference_type: 'payment',
      reference_id: payment.id,
    };

    const { data: movementData, error: movementError } = await supabase
      .from('cash_register_movements')
      .insert([movementPayload] as any)
      .select('*')
      .single();

    if (movementError) throw new Error(movementError.message);

    return {
      product: updatedProduct as ProductRow,
      payment,
      splits: (splitsData as PaymentSplitRow[]) ?? [],
      movement: movementData as CashRegisterMovementRow,
    };
  }
}