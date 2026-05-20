import { Request, Response } from 'express';
import { MembershipFreezeService } from '../service/membershipFreezeService.js';
import { MembershipFreezeInsert, MembershipFreezeUpdate } from '../types/database.js';
import config from '../config/config.js';

/**
 * Helper function to map error messages to appropriate HTTP status codes
 */
function handleControllerError(err: unknown, defaultMessage: string, res: Response) {
  if (config.nodeEnv === 'development') {
    console.error(err);
  }
  let errorMessage = err instanceof Error ? err.message : defaultMessage;
  let status = 500;

  // Intercept and translate low-level coercion errors from database
  if (errorMessage.includes('Cannot coerce the result to a single JSON object')) {
    status = 404;
    if (errorMessage.includes('[membership_freeze]')) {
      errorMessage = 'El registro de congelamiento solicitado no existe.';
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
    errorMessage.includes('ya congelada') ||
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
    errorMessage.includes('anterior') ||
    errorMessage.includes('posterior')
  ) {
    status = 400;
  }

  return res.status(status).json({
    success: false,
    message: errorMessage
  });
}

export default class MembershipFreezeController {
  private membershipFreezeService: MembershipFreezeService;

  constructor(membershipFreezeService: MembershipFreezeService) {
    this.membershipFreezeService = membershipFreezeService;
  }

  /**
   * Create a new membership freeze
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async createFreeze(req: any, res: Response) {
    try {
      const membershipId = req.params.membershipId;
      const { start_date, end_date, is_indefinite } = req.body;
      const createdBy = req.user?.userId;

      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la membresía (membershipId) es requerido en los parámetros.'
        });
      }

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. El ID de usuario es requerido.'
        });
      }

      if (!start_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio (start_date) es obligatoria.'
        });
      }

      const startDateObj = new Date(start_date);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio (start_date) tiene un formato inválido.'
        });
      }

      let endDateObj: Date;
      if (!is_indefinite) {
        if (!end_date) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin (end_date) es obligatoria a menos que el congelamiento sea indefinido.'
          });
        }
        endDateObj = new Date(end_date);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin (end_date) tiene un formato inválido.'
          });
        }
        if (endDateObj <= startDateObj) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin (end_date) debe ser posterior a la fecha de inicio (start_date).'
          });
        }
      } else {
        endDateObj = new Date(startDateObj); // Fallback standard
      }

      const freezeData: MembershipFreezeInsert = {
        membership_id: membershipId,
        start_date: startDateObj,
        end_date: endDateObj,
        is_indefinite: !!is_indefinite,
        created_by: createdBy
      };

      const freeze = await this.membershipFreezeService.createFreeze(freezeData);
      res.status(201).json({
        success: true,
        message: 'Membresía congelada exitosamente.',
        freeze
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al congelar la membresía.', res);
    }
  }

  /**
   * Update an existing membership freeze
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async updateFreeze(req: Request, res: Response) {
    try {
      const freezeId = req.params.freezeId;
      if (!freezeId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del congelamiento es requerido en los parámetros.'
        });
      }

      const updates: MembershipFreezeUpdate = req.body;
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para realizar la actualización.'
        });
      }

      if (updates.start_date) {
        const d = new Date(updates.start_date);
        if (isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio (start_date) tiene un formato de fecha inválido.'
          });
        }
        updates.start_date = d;
      }
      if (updates.end_date) {
        const d = new Date(updates.end_date);
        if (isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin (end_date) tiene un formato de fecha inválido.'
          });
        }
        updates.end_date = d;
      }

      const freeze = await this.membershipFreezeService.updateFreeze(freezeId, updates);
      res.status(200).json({
        success: true,
        message: 'Congelamiento actualizado exitosamente.',
        freeze
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al actualizar el congelamiento.', res);
    }
  }

  /**
   * Get all freezes of a membership
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getFreezesByMembershipId(req: Request, res: Response) {
    try {
      const membershipId = req.params.membershipId;
      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la membresía es requerido en los parámetros.'
        });
      }

      const freezes = await this.membershipFreezeService.getFreezesByMembershipId(membershipId);
      res.status(200).json({
        success: true,
        freezes
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener los congelamientos de la membresía.', res);
    }
  }

  /**
   * Cancel an active membership freeze (unfreeze)
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async cancelFreeze(req: Request, res: Response) {
    try {
      const freezeId = req.params.freezeId;
      if (!freezeId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del congelamiento es requerido en los parámetros.'
        });
      }

      const freeze = await this.membershipFreezeService.cancelFreeze(freezeId);
      res.status(200).json({
        success: true,
        message: 'Congelamiento cancelado exitosamente. La membresía ha sido descongelada.',
        freeze
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al cancelar el congelamiento.', res);
    }
  }

  /**
   * Activate a membership freeze
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async activateFreeze(req: Request, res: Response) {
    try {
      const freezeId = req.params.freezeId;
      if (!freezeId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del congelamiento es requerido en los parámetros.'
        });
      }

      const freeze = await this.membershipFreezeService.activateFreeze(freezeId);
      res.status(200).json({
        success: true,
        message: 'Congelamiento activado exitosamente.',
        freeze
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al activar el congelamiento.', res);
    }
  }
}
