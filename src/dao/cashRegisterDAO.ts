import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type {
  CashRegisterSessionRow,
  CashRegisterSessionInsert,
  CashRegisterSessionUpdate,
  CashRegisterMovementRow,
  CashRegisterMovementInsert,
} from '../types/database.js';

export class CashRegisterDAO extends BaseDAO<
  CashRegisterSessionRow,
  CashRegisterSessionInsert,
  CashRegisterSessionUpdate
> {
  constructor() {
    super('cash_register_sessions');
  }

  /**
   * Retrieves the currently open session (closed_at is null).
   * Returns null if no open session exists.
   * @returns The open session row or null.
   */
  async findOpenSession(): Promise<CashRegisterSessionRow | null> {
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .is('closed_at', null)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[cash_register_sessions] findOpenSession: ${error.message}`);
    }

    return data as CashRegisterSessionRow | null;
  }

  /**
   * Closes an open session by setting closing_balance, closed_by and closed_at.
   * @param sessionId - The bigint ID of the session to close.
   * @param closedBy - The user ID who is closing the session.
   * @param closingBalance - The real cash amount counted at closing.
   * @param notes - Optional closing notes.
   * @returns The updated session row.
   */
  async closeSession(
    sessionId: number,
    closedBy: number,
    closingBalance: number,
    notes?: string
  ): Promise<CashRegisterSessionRow> {
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .update({
        closed_by: closedBy,
        closing_balance: closingBalance,
        closed_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[cash_register_sessions] closeSession: ${error.message}`);
    }

    return data as CashRegisterSessionRow;
  }

  /**
   * Creates a new movement (income or expense) linked to a session.
   * @param payload - Movement insert payload.
   * @returns The created movement row.
   */
  async createMovement(
    payload: CashRegisterMovementInsert
  ): Promise<CashRegisterMovementRow> {
    const { data, error } = await supabase
      .from('cash_register_movements')
      .insert([payload] as any)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[cash_register_movements] createMovement: ${error.message}`);
    }

    return data as CashRegisterMovementRow;
  }

  /**
   * Retrieves all movements for a given session ordered by created_at ascending.
   * @param sessionId - The bigint ID of the session.
   * @returns Array of movement rows.
   */
  async findMovementsBySession(sessionId: number): Promise<CashRegisterMovementRow[]> {
    const { data, error } = await supabase
      .from('cash_register_movements')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`[cash_register_movements] findMovementsBySession: ${error.message}`);
    }

    return (data as CashRegisterMovementRow[]) ?? [];
  }

  /**
   * Retrieves all sessions with optional date range filter ordered by opened_at descending.
   * @param from - Optional start date filter (ISO string).
   * @param to - Optional end date filter (ISO string).
   * @returns Array of session rows.
   */
  async findSessions(from?: string, to?: string): Promise<CashRegisterSessionRow[]> {
    let query = supabase
      .from('cash_register_sessions')
      .select('*')
      .order('opened_at', { ascending: false });

    if (from) query = query.gte('opened_at', from);
    if (to) query = query.lte('opened_at', to);

    const { data, error } = await query;

    if (error) {
      throw new Error(`[cash_register_sessions] findSessions: ${error.message}`);
    }

    return (data as CashRegisterSessionRow[]) ?? [];
  }
}