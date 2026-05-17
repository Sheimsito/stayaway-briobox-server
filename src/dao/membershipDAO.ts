import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type { MembershipRow, MembershipInsert, MembershipUpdate } from '../types/database.js';

export class MembershipDAO extends BaseDAO<MembershipRow, MembershipInsert, MembershipUpdate> {
  constructor() {
    super('membership');
  }

  async create(membership: MembershipInsert): Promise<MembershipRow> {
    const membershipCreated = await super.create({ ...membership });
    return membershipCreated;
  }

  async update(membershipId: string, membership: MembershipUpdate): Promise<MembershipRow> {
    const { data, error } = await supabase
      .from('membership')
      // @ts-ignore
      .update({ ...membership })
      .eq('id', membershipId)
      .select()
      .single();
    if (error) {
      console.error(`[MembershipDAO] update failed for ${membershipId}:`, error.message);
      throw new Error(`[membership] update: ${error.message}`);
    }
    return data as MembershipRow;
  }

  async findByClientId(clientId: string): Promise<MembershipRow[]> {
    const { data, error } = await supabase
      .from('membership')
      .select('*')
      .eq('customer_id', clientId);

    if (error) {
      console.error(`[MembershipDAO] findByClientId failed for ${clientId}:`, error.message);
      throw new Error(`[membership] findByClientId: ${error.message}`);
    }

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
    if (error) {
      console.error(`[MembershipDAO] cancelMembership failed for ${membershipId}:`, error.message);
      throw new Error(`[membership] cancelMembership: ${error.message}`);
    }
    return data as MembershipRow;
  }
}