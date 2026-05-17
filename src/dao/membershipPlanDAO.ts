import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type { MembershipPlanRow, MembershipPlanInsert, MembershipPlanUpdate } from '../types/database.js';


export class MembershipPlanDAO extends BaseDAO<MembershipPlanRow, MembershipPlanInsert, MembershipPlanUpdate> {
    constructor() {
        super('membership_plans');
    }

    async create(membershipPlan: MembershipPlanInsert): Promise<MembershipPlanRow> {
        const membershipPlanCreated = await super.create({ ...membershipPlan });
        return membershipPlanCreated;
    }

    async update(membershipPlanId: string, membershipPlan: MembershipPlanUpdate): Promise<MembershipPlanRow> {
        const { data, error } = await supabase
            .from('membership_plans')
            // @ts-ignore
            .update({ ...membershipPlan })
            .eq('id', membershipPlanId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipPlanDAO] update failed for ${membershipPlanId}:`, error.message);
            throw new Error(`[membership_plans] update: ${error.message}`);
        }
        return data as MembershipPlanRow;
    }

    async activateMembershipPlan(membershipPlanId: string): Promise<MembershipPlanRow> {
        const { data, error } = await supabase
            .from('membership_plans')
            // @ts-ignore
            .update({ is_active: true })
            .eq('id', membershipPlanId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipPlanDAO] activateMembershipPlan failed for ${membershipPlanId}:`, error.message);
            throw new Error(`[membership_plans] activateMembershipPlan: ${error.message}`);
        }
        return data as MembershipPlanRow;
    }

    async deactivateMembershipPlan(membershipPlanId: string): Promise<MembershipPlanRow> {
        const { data, error } = await supabase
            .from('membership_plans')
            // @ts-ignore
            .update({ is_active: false })
            .eq('id', membershipPlanId)
            .select()
            .single();
        if (error) {
            console.error(`[MembershipPlanDAO] deactivateMembershipPlan failed for ${membershipPlanId}:`, error.message);
            throw new Error(`[membership_plans] deactivateMembershipPlan: ${error.message}`);
        }
        return data as MembershipPlanRow;
    }

    async findActiveMembershipPlans(): Promise<MembershipPlanRow[]> {
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('is_active', true);
        if (error) {
            console.error(`[MembershipPlanDAO] findActiveMembershipPlans failed:`, error.message);
            throw new Error(`[membership_plans] findActiveMembershipPlans: ${error.message}`);
        }
        return (data as MembershipPlanRow[]) ?? [];
    }

    async findDisabledMembershipPlans(): Promise<MembershipPlanRow[]> {
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('is_active', false);
        if (error) {
            console.error(`[MembershipPlanDAO] findDisabledMembershipPlans failed:`, error.message);
            throw new Error(`[membership_plans] findDisabledMembershipPlans: ${error.message}`);
        }
        return (data as MembershipPlanRow[]) ?? [];
    }

    // THINKING TO ADD MORE METHODS AS:
    /*
    - soft delete membership plans
     
    */
    
}