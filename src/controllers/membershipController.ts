import { MembershipService } from '../service/membershipService.js';
import { Request, Response } from 'express';
import { MembershipInsert, MembershipUpdate } from '../types/database.js';
import config from '../config/config.js';


export  class MembershipController {
  private membershipService: MembershipService;

  constructor(membershipService: MembershipService) {
    this.membershipService = membershipService;
  }

  /**
   * Create a new membership
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async createMembership(req: Request, res: Response) {
    try {
      const { customerId, planId } = req.body;
      const membership = await this.membershipService.createMembership(customerId, planId);
      res.status(201).json({
        success: true,
        message: 'Membresía creada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la membresía.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Update an existing membership
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async updateMembership(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      const updates: MembershipUpdate = req.body;
      const membership = await this.membershipService.updateMembership(membershipId, updates);
      res.status(200).json({
        success: true,
        message: 'Membresía actualizada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la membresía.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Get a membership by its ID
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getMembershipById(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      const membership = await this.membershipService.getMembershipById(membershipId);
      res.status(200).json({
        success: true,
        membership
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la membresía.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Cancel a membership
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async cancelMembership(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      const membership = await this.membershipService.cancelMembership(membershipId);
      res.status(200).json({
        success: true,
        message: 'Membresía cancelada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar la membresía.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

 

  /**
   * Get all memberships (Admin only)
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getAllMemberships(req: Request, res: Response) {
    try {
      
      const memberships = await this.membershipService.getAllMemberships();
      res.status(200).json({
        success: true,
        memberships
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener las membresías.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Get active memberships (Admin only)
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getActiveMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getActiveMemberships();
      res.status(200).json({
        success: true,
        memberships
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener las membresías activas.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Get cancelled memberships (Admin only)
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getCancelledMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getCancelledMemberships();
      res.status(200).json({
        success: true,
        memberships
      });
    } catch (err: unknown) {
      if (config.nodeEnv === 'development') {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener las membresías canceladas.';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }
}