import { MembershipService } from '../service/membershipService.js';
import { Request, Response } from 'express';
import { MembershipInsert, MembershipUpdate } from '../types/database.js';
import config from '../config/config.js';

/**
 * Helper function to map error messages to appropriate HTTP status codes
 */
function handleControllerError(err: unknown, defaultMessage: string, res: Response) {
  if (config.nodeEnv === 'development') {
    console.error(err);
  }
  const errorMessage = err instanceof Error ? err.message : defaultMessage;
  
  let status = 500;
  if (
    errorMessage.includes('no encontrado') || 
    errorMessage.includes('no encontrada') || 
    errorMessage.includes('no se encontró') ||
    errorMessage.includes('no existe')
  ) {
    status = 404;
  } else if (
    errorMessage.includes('ya tiene') || 
    errorMessage.includes('ya se encuentra') || 
    errorMessage.includes('ya actualmente') ||
    errorMessage.includes('ya está')
  ) {
    status = 409;
  } else if (
    errorMessage.includes('no está activo') || 
    errorMessage.includes('inválido') || 
    errorMessage.includes('requerido') || 
    errorMessage.includes('obligatorio') ||
    errorMessage.includes('debe ser')
  ) {
    status = 400;
  }

  return res.status(status).json({
    success: false,
    message: errorMessage
  });
}

export default class MembershipController {
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
      
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del cliente (customerId) es obligatorio.'
        });
      }
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del plan (planId) es obligatorio.'
        });
      }

      const membership = await this.membershipService.createMembership(customerId, planId);
      res.status(201).json({
        success: true,
        message: 'Membresía creada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al crear la membresía.', res);
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
      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la membresía es requerido en los parámetros.'
        });
      }

      const updates: MembershipUpdate = req.body;
      const membership = await this.membershipService.updateMembership(membershipId, updates);
      res.status(200).json({
        success: true,
        message: 'Membresía actualizada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al actualizar la membresía.', res);
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
      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la membresía es requerido en los parámetros.'
        });
      }

      const membership = await this.membershipService.getMembershipById(membershipId);
      if (!membership) {
        return res.status(404).json({
          success: false,
          message: `La membresía con ID ${membershipId} no existe.`
        });
      }

      res.status(200).json({
        success: true,
        membership
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener la membresía.', res);
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
      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la membresía es requerido en los parámetros.'
        });
      }

      const membership = await this.membershipService.cancelMembership(membershipId);
      res.status(200).json({
        success: true,
        message: 'Membresía cancelada exitosamente.',
        membership
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al cancelar la membresía.', res);
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
      handleControllerError(err, 'Error al obtener las membresías.', res);
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
      handleControllerError(err, 'Error al obtener las membresías activas.', res);
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
      handleControllerError(err, 'Error al obtener las membresías canceladas.', res);
    }
  }

  /**
   * Get pending memberships (Admin only)
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getPendingMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getPendingMemberships();
      res.status(200).json({
        success: true,
        memberships,
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener las membresías pendientes.', res);
    }
  }
}