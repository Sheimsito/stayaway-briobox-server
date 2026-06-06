import { MembershipFreezeDAO } from '../dao/membershipFreezeDAO.js';
import { MembershipDAO } from '../dao/membershipDAO.js';
import type { MembershipFreezeRow, MembershipFreezeInsert, MembershipFreezeUpdate } from '../types/database.js';

export class MembershipFreezeService {
  private membershipFreezeDAO: MembershipFreezeDAO;
  private membershipDAO: MembershipDAO;

  constructor() {
    this.membershipFreezeDAO = new MembershipFreezeDAO();
    this.membershipDAO = new MembershipDAO();
  }

  /**
   * Create a new membership freeze
   * @async
   * @param freezeData 
   * @returns 
   * @throws {Error} Throws an error if the membership doesn't exist or if there is already an active freeze.
   */
  async createFreeze(freezeData: MembershipFreezeInsert): Promise<MembershipFreezeRow> {
    // Validate that the membership exists
    const membership = await this.membershipDAO.findById(freezeData.membership_id);
    if (!membership) {
      throw new Error(`La membresía con ID ${freezeData.membership_id} no se encontró.`);
    }

    // Validate if the membership already has an active freeze
    // Depending on the DAO this could use findActiveMembershipFreezes
    const activeFreezes = await this.membershipFreezeDAO.findActiveMembershipFreezes(String(freezeData.membership_id));
    if (activeFreezes.length > 0) {
      throw new Error('La membresía ya se encuentra congelada actualmente.');
    }

    // Create the freeze
    return await this.membershipFreezeDAO.create(freezeData);
  }

  /**
   * Update an existing membership freeze
   * @async
   * @param freezeId
   * @param updates
   * @returns 
   * @throws {Error} Throws an error if the freeze doesn't exist.
   */
  async updateFreeze(freezeId: string, updates: MembershipFreezeUpdate): Promise<MembershipFreezeRow> {
    return await this.membershipFreezeDAO.update(freezeId, updates);
  }

  /**
   * Get all freezes associated with a membership
   * @async
   * @param membershipId
   * @returns 
   * @throws {Error} Throws an error if the membership doesn't exist.
   */
  async getFreezesByMembershipId(membershipId: string): Promise<MembershipFreezeRow[]> {
    return await this.membershipFreezeDAO.findByMembershipId(membershipId);
  }

  /**
   * Cancel an active membership freeze
   * @async
   * @param freezeId
   * @returns 
   * @throws {Error} Throws an error if the freeze doesn't exist.
   */
  async cancelFreeze(freezeId: string): Promise<MembershipFreezeRow> {
    const freeze = await this.membershipFreezeDAO.findById(freezeId);
    if (!freeze) {
      throw new Error('Congelamiento no encontrado.');
    }
    return await this.membershipFreezeDAO.cancelMembershipFreeze(freezeId);
  }

  /**
   * Activate a membership freeze (if it was previously cancelled or inactive)
   * @async
   * @param freezeId
   * @returns 
   * @throws {Error} Throws an error if the freeze doesn't exist.
   */
  async activateFreeze(freezeId: string): Promise<MembershipFreezeRow> {
    const freeze = await this.membershipFreezeDAO.findById(freezeId);
    if (!freeze) {
      throw new Error('Congelamiento no encontrado.');
    }
    return await this.membershipFreezeDAO.activateMembershipFreeze(freezeId);
  }
}
