import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type {
  PaymentRow,
  PaymentInsert,
  PaymentUpdate,
  PaymentSplitRow,
  PaymentSplitInsert,
} from '../types/database.js';

export class PaymentDAO extends BaseDAO<PaymentRow, PaymentInsert, PaymentUpdate> {
  constructor() {
    super('payments');
  }

  /**
   * Creates a payment record and all its splits sequentially.
   * @param payment - Payment insert payload.
   * @param splits - Split payloads without payment_id, assigned internally after payment creation.
   * @returns Object containing the created payment and its splits.
   */
  async createWithSplits(
    payment: PaymentInsert,
    splits: Omit<PaymentSplitInsert, 'payment_id'>[]
  ): Promise<{ payment: PaymentRow; splits: PaymentSplitRow[] }> {
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([payment] as any)
      .select('*')
      .single();

    if (paymentError) {
      throw new Error(`[payments] createWithSplits: ${paymentError.message}`);
    }

    const createdPayment = paymentData as PaymentRow;

    const splitsPayload: PaymentSplitInsert[] = splits.map((s) => ({
      ...s,
      payment_id: createdPayment.id,
    }));

    const { data: splitsData, error: splitsError } = await supabase
      .from('payment_splits')
      .insert(splitsPayload as any)
      .select('*');

    if (splitsError) {
      throw new Error(`[payment_splits] createWithSplits: ${splitsError.message}`);
    }

    return {
      payment: createdPayment,
      splits: (splitsData as PaymentSplitRow[]) ?? [],
    };
  }

  /**
   * Retrieves all payments for a given customer ordered by created_at descending.
   * @param customerId - The bigint ID of the customer.
   * @returns Array of payment rows.
   */
  async findByCustomerId(customerId: number): Promise<PaymentRow[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[payments] findByCustomerId: ${error.message}`);
    }

    return (data as PaymentRow[]) ?? [];
  }

  /**
   * Retrieves all splits associated with a given payment.
   * @param paymentId - The bigint ID of the payment.
   * @returns Array of payment split rows.
   */
  async findSplitsByPaymentId(paymentId: number): Promise<PaymentSplitRow[]> {
    const { data, error } = await supabase
      .from('payment_splits')
      .select('*')
      .eq('payment_id', paymentId);

    if (error) {
      throw new Error(`[payment_splits] findSplitsByPaymentId: ${error.message}`);
    }

    return (data as PaymentSplitRow[]) ?? [];
  }
}