import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type { MembershipFreezeRow, MembershipFreezeInsert, MembershipFreezeUpdate } from '../types/database.js';

export class MembershipFreezeDAO extends BaseDAO<MembershipFreezeRow, MembershipFreezeInsert, MembershipFreezeUpdate> {
    constructor() {
        super('membership_freeze');
    }

    async create(membershipFreeze: MembershipFreezeInsert): Promise<MembershipFreezeRow> {
        const membershipFreezeCreated = await super.create({ ...membershipFreeze });
        return membershipFreezeCreated;
    }

    async update(membershipFreezeId: string, membershipFreeze: MembershipFreezeUpdate): Promise<MembershipFreezeRow> {
        const { data, error } = await supabase
            .from('membership_freeze')
            // @ts-ignore
            .update({ ...membershipFreeze })
            .eq('id', membershipFreezeId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipFreezeDAO] update failed for ${membershipFreezeId}:`, error.message);
            throw new Error(`[membership_freeze] update: ${error.message}`);
        }
        return data as MembershipFreezeRow;
    }

    async findByMembershipId(membershipId: string): Promise<MembershipFreezeRow[]> {
        const { data, error } = await supabase
            .from('membership_freeze')
            .select('*')
            .eq('membership_id', membershipId);
        if (error) {
            console.error(`[MembershipFreezeDAO] findByMembershipId failed for ${membershipId}:`, error.message);
            throw new Error(`[membership_freeze] findByMembershipId: ${error.message}`);
        }
        return (data as MembershipFreezeRow[]) ?? [];
    }

    // 
    async findActiveMembershipFreezes(membershipId: string): Promise<MembershipFreezeRow[]> {
        const { data, error } = await supabase
            .from('membership_freeze')
            .select('*')
            .eq('membership_id', membershipId)
            .eq('is_active', true);
        if (error) {
            console.error(`[MembershipFreezeDAO] findActiveMembershipFreezes failed for ${membershipId}:`, error.message);
            throw new Error(`[membership_freeze] findActiveMembershipFreezes: ${error.message}`);
        }
        return (data as MembershipFreezeRow[]) ?? [];
    }

    async findExpiredMembershipFreezes(membershipId: string): Promise<MembershipFreezeRow[]> {
        const { data, error } = await supabase
            .from('membership_freeze')
            .select('*')
            .eq('membership_id', membershipId)
            .eq('is_active', false);
        if (error) {
            console.error(`[MembershipFreezeDAO] findExpiredMembershipFreezes failed for ${membershipId}:`, error.message);
            throw new Error(`[membership_freeze] findExpiredMembershipFreezes: ${error.message}`);
        }
        return (data as MembershipFreezeRow[]) ?? [];
    }

    async cancelMembershipFreeze(membershipFreezeId: string): Promise<MembershipFreezeRow> {
        const { data, error } = await supabase
            .from('membership_freeze')
            // @ts-ignore
            .update({ is_active: false })
            .eq('id', membershipFreezeId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipFreezeDAO] cancelMembershipFreeze failed for ${membershipFreezeId}:`, error.message);
            throw new Error(`[membership_freeze] cancelMembershipFreeze: ${error.message}`);
        }
        return data as MembershipFreezeRow;
    }

    async activateMembershipFreeze(membershipFreezeId: string): Promise<MembershipFreezeRow> {
        const { data, error } = await supabase
            .from('membership_freeze')
            // @ts-ignore
            .update({ is_active: true })
            .eq('id', membershipFreezeId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipFreezeDAO] activateMembershipFreeze failed for ${membershipFreezeId}:`, error.message);
            throw new Error(`[membership_freeze] activateMembershipFreeze: ${error.message}`);
        }
        return data as MembershipFreezeRow;
    }

}