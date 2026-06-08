import { MembershipService } from '../service/membershipService.js';
import { Request, Response } from 'express';
import { MembershipUpdate } from '../types/database.js';
import config from '../config/config.js';

function handleControllerError(err: unknown, defaultMessage: string, res: Response) {
  if (config.nodeEnv === 'development') {
    console.error(err);
  }
  let errorMessage = err instanceof Error ? err.message : defaultMessage;
  let status = 500;

  if (errorMessage.includes('Cannot coerce the result to a single JSON object')) {
    status = 404;
    if (errorMessage.includes('[membership_plans]')) {
      errorMessage = 'El plan de membresía especificado no existe.';
    } else if (errorMessage.includes('[clients]')) {
      errorMessage = 'El cliente especificado no existe.';
    } else if (errorMessage.includes('[membership]')) {
      errorMessage = 'No se encontró la membresía solicitada.';
    } else {
      errorMessage = 'El recurso solicitado no existe.';
    }
  } else if (
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
    errorMessage.includes('debe ser') ||
    errorMessage.includes('vacío') ||
    errorMessage.includes('proporcionar') ||
    errorMessage.includes('sesión de caja')
  ) {
    status = 400;
  }

  return res.status(status).json({ success: false, message: errorMessage });
}

export default class MembershipController {
  private membershipService: MembershipService;

  constructor(membershipService: MembershipService) {
    this.membershipService = membershipService;
  }

  /**
   * Creates a new membership with its associated payment and cash register movement.
   * Requires an open cash register session.
   * @param req - Request with body: customerId, planId, payment_method. User ID from token.
   * @param res - Response with created membership, payment, splits and movement.
   */
  async createMembership(req: any, res: Response) {
    try {
      const { customerId, planId, payment_method } = req.body;

      if (!customerId) {
        return res.status(400).json({ success: false, message: 'El ID del cliente (customerId) es obligatorio.' });
      }
      if (!planId) {
        return res.status(400).json({ success: false, message: 'El ID del plan (planId) es obligatorio.' });
      }
      if (!payment_method) {
        return res.status(400).json({ success: false, message: 'El método de pago (payment_method) es obligatorio.' });
      }

      const sellerId = Number(req.user.userId);
      const result = await this.membershipService.createMembership(customerId, planId, sellerId, payment_method);

      return res.status(201).json({
        success: true,
        message: 'Membresía creada exitosamente.',
        ...result,
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al crear la membresía.', res);
    }
  }

  /**
   * Updates an existing membership.
   * @param req - Request with param id and body with fields to update.
   * @param res - Response with updated membership.
   */
  async updateMembership(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      if (!membershipId) {
        return res.status(400).json({ success: false, message: 'El ID de la membresía es requerido en los parámetros.' });
      }

      const updates: MembershipUpdate = req.body;
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un campo para realizar la actualización.' });
      }

      const membership = await this.membershipService.updateMembership(membershipId, updates);
      return res.status(200).json({ success: true, message: 'Membresía actualizada exitosamente.', membership });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al actualizar la membresía.', res);
    }
  }

  /**
   * Returns a membership by its ID.
   * @param req - Request with param id.
   * @param res - Response with membership data.
   */
  async getMembershipById(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      if (!membershipId) {
        return res.status(400).json({ success: false, message: 'El ID de la membresía es requerido en los parámetros.' });
      }

      const membership = await this.membershipService.getMembershipById(membershipId);
      if (!membership) {
        return res.status(404).json({ success: false, message: `La membresía con ID ${membershipId} no existe.` });
      }

      return res.status(200).json({ success: true, membership });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener la membresía.', res);
    }
  }

  /**
   * Cancels an existing membership.
   * @param req - Request with param id.
   * @param res - Response with cancelled membership.
   */
  async cancelMembership(req: Request, res: Response) {
    try {
      const membershipId = req.params.id;
      if (!membershipId) {
        return res.status(400).json({ success: false, message: 'El ID de la membresía es requerido en los parámetros.' });
      }

      const membership = await this.membershipService.cancelMembership(membershipId);
      return res.status(200).json({ success: true, message: 'Membresía cancelada exitosamente.', membership });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al cancelar la membresía.', res);
    }
  }

  /**
   * Returns all memberships.
   * @param req - Request object.
   * @param res - Response with all memberships.
   */
  async getAllMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getAllMemberships();
      return res.status(200).json({ success: true, memberships });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener las membresías.', res);
    }
  }

  /**
   * Returns all active memberships.
   * @param req - Request object.
   * @param res - Response with active memberships.
   */
  async getActiveMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getActiveMemberships();
      return res.status(200).json({ success: true, memberships });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener las membresías activas.', res);
    }
  }

  /**
   * Returns all cancelled memberships.
   * @param req - Request object.
   * @param res - Response with cancelled memberships.
   */
  async getCancelledMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getCancelledMemberships();
      return res.status(200).json({ success: true, memberships });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener las membresías canceladas.', res);
    }
  }

  /**
   * Returns all pending memberships.
   * @param req - Request object.
   * @param res - Response with pending memberships.
   */
  async getPendingMemberships(req: Request, res: Response) {
    try {
      const memberships = await this.membershipService.getPendingMemberships();
      return res.status(200).json({ success: true, memberships });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener las membresías pendientes.', res);
    }
  }
}