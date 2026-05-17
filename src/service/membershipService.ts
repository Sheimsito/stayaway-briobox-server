import { MembershipDAO } from '../dao/membershipDAO.js';
import { MembershipPlanDAO } from '../dao/membershipPlanDAO.js';
import { ClientDAO } from '../dao/clientDAO.js';
import type { MembershipRow, MembershipInsert, MembershipUpdate } from '../types/database.js';

export class MembershipService {
  private membershipDAO: MembershipDAO;
  private membershipPlanDAO: MembershipPlanDAO;
  private clientDAO: ClientDAO;

  constructor() {
    this.membershipDAO = new MembershipDAO();
    this.membershipPlanDAO = new MembershipPlanDAO();
    this.clientDAO = new ClientDAO();
  }

  /**
   * Create membership validating plans and active memberships
   */
  async createMembership(customerId: string, planId: string): Promise<MembershipRow> {
    // 1. Validate that the client exists
    const client = await this.clientDAO.findById(customerId);
    if (!client) {
      throw new Error(`Cliente con ID ${customerId} no encontrado.`);
    }

    // 2. Validate that the plan exists and is active
    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) {
      throw new Error(`El plan con ID ${planId} no se encontró.`);
    }
    if (!plan.is_active) {
      throw new Error(`El plan '${plan.name}' no está activo.`);
    }

    // 3. Validate if the client already has an active membership
    const existingMemberships = await this.membershipDAO.findByClientId(customerId);
    const hasActive = existingMemberships.some((m) => {
      // We consider active if the status is 'activa' and the end date has not passed
      return m.status === 'activa' && new Date(m.end_date) > new Date();
    });

    if (hasActive) {
      throw new Error('El cliente ya tiene una membresía activa.');
    }

    // 4. Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.duration_days);

    // 5. Create the membership
    const membershipData: MembershipInsert = {
      customer_id: customerId,
      plan_id: planId,
      status: 'activa',
      start_date: startDate,
      end_date: endDate,
    };

    return await this.membershipDAO.create(membershipData);
  }

  /**
   * Cancel membership
   */
  async cancelMembership(membershipId: string): Promise<MembershipRow> {
    const membership = await this.membershipDAO.findById(membershipId);
    if (!membership) {
      throw new Error('Membresía no encontrada.');
    }
    if (membership.status === 'cancelada') {
      throw new Error('La membresía ya se encuentra cancelada.');
    }

    return await this.membershipDAO.cancelMembership(membershipId);
  }

  /**
   * Get all memberships of a client
   */
  async getClientMemberships(customerId: string): Promise<MembershipRow[]> {
    return await this.membershipDAO.findByClientId(customerId);
  }

  /**
   * Get membership detail
   */
  async getMembershipById(membershipId: string): Promise<MembershipRow> {
    return await this.membershipDAO.findById(membershipId);
  }

  /**
   * Update membership data manually (ej. extension of dates)
   */
  async updateMembership(membershipId: string, updates: MembershipUpdate): Promise<MembershipRow> {
    return await this.membershipDAO.update(membershipId, updates);
  }

  async getAllMemberships(): Promise<MembershipRow[]> {
    return await this.membershipDAO.findAll();
  }

  async getActiveMemberships(): Promise<MembershipRow[]> {
    return await this.membershipDAO.findAll({ status: 'activa' });
  }

  async getCancelledMemberships(): Promise<MembershipRow[]> {
    return await this.membershipDAO.findAll({ status: 'cancelada' });
  }

  async getPendingMemberships(): Promise<MembershipRow[]> {
    return await this.membershipDAO.findAll({ status: 'pendiente' });
  }
}
