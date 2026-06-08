import { MembershipDAO } from '../dao/membershipDAO.js';
import { MembershipPlanDAO } from '../dao/membershipPlanDAO.js';
import { ClientDAO } from '../dao/clientDAO.js';
import type { MembershipRow, MembershipInsert, MembershipUpdate, PaymentRow, PaymentSplitRow, CashRegisterMovementRow } from '../types/database.js';

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
   * Creates a membership validating plan, client and active memberships.
   * Requires an open cash register session.
   * @param customerId - Client ID
   * @param planId - Plan ID to assign
   * @param sellerId - User processing the sale
   * @param paymentMethod - Payment method used
   */
  async createMembership(
    customerId: string,
    planId: string,
    sellerId: number,
    paymentMethod: string,
  ): Promise<{
    membership: MembershipRow;
    payment: PaymentRow;
    splits: PaymentSplitRow[];
    movement: CashRegisterMovementRow;
  }> {
    const client = await this.clientDAO.findById(customerId);
    if (!client) throw new Error(`Cliente con ID ${customerId} no encontrado.`);

    const plan = await this.membershipPlanDAO.findById(planId);
    if (!plan) throw new Error(`El plan con ID ${planId} no se encontró.`);
    if (!plan.is_active) throw new Error(`El plan '${plan.name}' no está activo.`);

    const existingMemberships = await this.membershipDAO.findByClientId(customerId);
    const hasActive = existingMemberships.some(
      (m) => m.status === 'activa' && new Date(m.end_date) > new Date(),
    );
    if (hasActive) throw new Error('El cliente ya tiene una membresía activa.');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.duration_days);

    const membershipData: MembershipInsert = {
      customer_id: customerId,
      plan_id: planId,
      status: 'activa',
      start_date: startDate,
      end_date: endDate,
    };

    return this.membershipDAO.createWithPayment(
      membershipData,
      plan.name,
      plan.price,
      customerId,
      sellerId,
      paymentMethod,
    );
  }

  /**
   * Cancels an existing membership.
   * @param membershipId - Membership ID to cancel
   */
  async cancelMembership(membershipId: string): Promise<MembershipRow> {
    const membership = await this.membershipDAO.findById(membershipId);
    if (!membership) throw new Error('Membresía no encontrada.');
    if (membership.status === 'cancelada') throw new Error('La membresía ya se encuentra cancelada.');
    return this.membershipDAO.cancelMembership(membershipId);
  }

  /**
   * Returns all memberships of a client.
   * @param customerId - Client ID
   */
  async getClientMemberships(customerId: string): Promise<MembershipRow[]> {
    return this.membershipDAO.findByClientId(customerId);
  }

  /**
   * Returns membership detail by ID.
   * @param membershipId - Membership ID
   */
  async getMembershipById(membershipId: string): Promise<MembershipRow> {
    return this.membershipDAO.findById(membershipId);
  }

  /**
   * Manually updates membership data (e.g. date extension).
   * @param membershipId - Membership ID
   * @param updates - Fields to update
   */
  async updateMembership(membershipId: string, updates: MembershipUpdate): Promise<MembershipRow> {
    return this.membershipDAO.update(membershipId, updates);
  }

  async getAllMemberships(): Promise<MembershipRow[]> {
    return this.membershipDAO.findAll();
  }

  async getActiveMemberships(): Promise<MembershipRow[]> {
    return this.membershipDAO.findAll({ status: 'activa' });
  }

  async getCancelledMemberships(): Promise<MembershipRow[]> {
    return this.membershipDAO.findAll({ status: 'cancelada' });
  }

  async getPendingMemberships(): Promise<MembershipRow[]> {
    return this.membershipDAO.findAll({ status: 'pendiente' });
  }
}