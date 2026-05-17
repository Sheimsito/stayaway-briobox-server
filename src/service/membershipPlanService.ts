import { MembershipPlanDAO } from '../dao/membershipPlanDAO.js';
import type { MembershipPlanRow, MembershipPlanInsert, MembershipPlanUpdate } from '../types/database.js';

export class MembershipPlanService {
  private membershipPlanDAO: MembershipPlanDAO;

  constructor() {
    this.membershipPlanDAO = new MembershipPlanDAO();
  }

  /**
   * Create a new membership plan
   * @async
   * @param planData 
   * @returns 
   * @throws {Error} Throws an error if creation fails.
   */
  async createPlan(planData: MembershipPlanInsert): Promise<MembershipPlanRow> {
    return await this.membershipPlanDAO.create(planData);
  }

  /**
   * Update an existing membership plan
   * @async
   * @param planId 
   * @param updates 
   * @returns 
   * @throws {Error} Throws an error if the plan doesn't exist or update fails.
   */
  async updatePlan(planId: string, updates: MembershipPlanUpdate): Promise<MembershipPlanRow> {
    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) {
      throw new Error(`El plan con ID ${planId} no se encontró.`);
    }
    return await this.membershipPlanDAO.update(planId, updates);
  }

  /**
   * Get a membership plan by its ID
   * @async
   * @param planId 
   * @returns 
   * @throws {Error} Throws an error if the plan doesn't exist.
   */
  async getPlanById(planId: string): Promise<MembershipPlanRow> {
    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) {
      throw new Error(`El plan con ID ${planId} no se encontró.`);
    }
    return plan;
  }

  /**
   * Activate a membership plan
   * @async
   * @param planId 
   * @returns 
   * @throws {Error} Throws an error if the plan doesn't exist.
   */
  async activatePlan(planId: string): Promise<MembershipPlanRow> {
    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) {
      throw new Error(`El plan con ID ${planId} no se encontró.`);
    }
    return await this.membershipPlanDAO.activateMembershipPlan(planId);
  }

  /**
   * Deactivate a membership plan
   * @async
   * @param planId 
   * @returns 
   * @throws {Error} Throws an error if the plan doesn't exist.
   */
  async deactivatePlan(planId: string): Promise<MembershipPlanRow> {
    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) {
      throw new Error(`El plan con ID ${planId} no se encontró.`);
    }
    return await this.membershipPlanDAO.deactivateMembershipPlan(planId);
  }

  /**
   * Get all active membership plans
   * @async
   * @returns 
   */
  async getActivePlans(): Promise<MembershipPlanRow[]> {
    return await this.membershipPlanDAO.findActiveMembershipPlans();
  }

  /**
   * Get all disabled membership plans
   * @async
   * @returns 
   */
  async getDisabledPlans(): Promise<MembershipPlanRow[]> {
    return await this.membershipPlanDAO.findDisabledMembershipPlans();
  }
}
