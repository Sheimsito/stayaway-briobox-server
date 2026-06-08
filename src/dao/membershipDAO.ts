import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type {
  MembershipRow,
  MembershipInsert,
  MembershipUpdate,
  PaymentInsert,
  PaymentRow,
  PaymentSplitInsert,
  PaymentSplitRow,
  CashRegisterMovementInsert,
  CashRegisterMovementRow,
} from '../types/database.js';

export class MembershipDAO extends BaseDAO<MembershipRow, MembershipInsert, MembershipUpdate> {
  constructor() {
    super('membership');
  }

  async create(membership: MembershipInsert): Promise<MembershipRow> {
    return super.create({ ...membership });
  }

  async update(membershipId: string, membership: MembershipUpdate): Promise<MembershipRow> {
    const { data, error } = await supabase
      .from('membership')
      // @ts-ignore
      .update({ ...membership })
      .eq('id', membershipId)
      .select()
      .single();
    if (error) throw new Error(`[membership] update: ${error.message}`);
    return data as MembershipRow;
  }

  async findByClientId(clientId: string): Promise<MembershipRow[]> {
    const { data, error } = await supabase
      .from('membership')
      .select('*')
      .eq('customer_id', clientId);
    if (error) throw new Error(`[membership] findByClientId: ${error.message}`);
    return (data as MembershipRow[]) ?? [];
  }

  async cancelMembership(membershipId: string): Promise<MembershipRow> {
    const { data, error } = await supabase
      .from('membership')
      // @ts-ignore
      .update({ status: 'cancelada' })
      .eq('id', membershipId)
      .select()
      .single();
    if (error) throw new Error(`[membership] cancelMembership: ${error.message}`);
    return data as MembershipRow;
  }

  async findAll(filters?: { status?: string; customer_id?: string }): Promise<MembershipRow[]> {
    let query = supabase.from('membership').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
    const { data, error } = await query;
    if (error) throw new Error(`[membership] findAll: ${error.message}`);
    return (data as MembershipRow[]) ?? [];
  }

  /**
   * Creates a membership along with its payment, payment split and cash register movement.
   * Requires an open cash register session.
   * @param membership - Membership data to insert
   * @param planName - Plan name for descriptions
   * @param planPrice - Plan price to charge
   * @param customerId - Client receiving the membership
   * @param sellerId - User processing the sale
   * @param paymentMethod - Payment method used
   * @returns Object with created membership, payment, splits and cash movement
   */
  async createWithPayment(
    membership: MembershipInsert,
    planName: string,
    planPrice: number,
    customerId: string,
    sellerId: number,
    paymentMethod: string,
  ): Promise<{
    membership: MembershipRow;
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

    const createdMembership = await super.create({ ...membership });

    const paymentPayload: PaymentInsert = {
      created_by: sellerId,
      customer_id: customerId,
      total_amount: planPrice,
      reference_type: 'membership',
      reference_id: null,
      notes: `Pago de membresía: plan ${planName}`,
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
      amount: planPrice,
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
      amount: planPrice,
      description: `Pago de membresía: plan ${planName} - cliente ${customerId}`,
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
      membership: createdMembership,
      payment,
      splits: (splitsData as PaymentSplitRow[]) ?? [],
      movement: movementData as CashRegisterMovementRow,
    };
  }
}