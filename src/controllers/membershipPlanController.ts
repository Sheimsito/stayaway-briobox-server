import { Request, Response } from 'express';
import { MembershipPlanService } from '../service/membershipPlanService.js';
import { MembershipPlanInsert, MembershipPlanUpdate } from '../types/database.js';
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
    errorMessage.includes('ya existe')
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

export default class MembershipPlanController {
  private membershipPlanService: MembershipPlanService;

  constructor(membershipPlanService: MembershipPlanService) {
    this.membershipPlanService = membershipPlanService;
  }

  /**
   * Create a new membership plan
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async createPlan(req: Request, res: Response) {
    try {
      const { name, price, duration_days }: MembershipPlanInsert = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del plan (name) es obligatorio y debe ser un texto válido.'
        });
      }
      if (price === undefined || typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio del plan (price) es obligatorio y debe ser un número mayor o igual a 0.'
        });
      }
      if (duration_days === undefined || typeof duration_days !== 'number' || duration_days <= 0 || !Number.isInteger(duration_days)) {
        return res.status(400).json({
          success: false,
          message: 'La duración en días (duration_days) es obligatoria y debe ser un número entero mayor a 0.'
        });
      }

      const plan = await this.membershipPlanService.createPlan({ name, price, duration_days });
      res.status(201).json({
        success: true,
        message: 'Plan de membresía creado exitosamente.',
        plan
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al crear el plan de membresía.', res);
    }
  }

  /**
   * Update an existing membership plan
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async updatePlan(req: Request, res: Response) {
    try {
      const planId = req.params.id;
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del plan es requerido en los parámetros.'
        });
      }

      const updates: MembershipPlanUpdate = req.body;
      
      if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del plan (name) debe ser un texto válido.'
        });
      }
      if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
        return res.status(400).json({
          success: false,
          message: 'El precio del plan (price) debe ser un número mayor o igual a 0.'
        });
      }
      if (updates.duration_days !== undefined && (typeof updates.duration_days !== 'number' || updates.duration_days <= 0 || !Number.isInteger(updates.duration_days))) {
        return res.status(400).json({
          success: false,
          message: 'La duración en días (duration_days) debe ser un número entero mayor a 0.'
        });
      }

      const plan = await this.membershipPlanService.updatePlan(planId, updates);
      res.status(200).json({
        success: true,
        message: 'Plan de membresía actualizado exitosamente.',
        plan
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al actualizar el plan de membresía.', res);
    }
  }

  /**
   * Get a membership plan by its ID
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getPlanById(req: Request, res: Response) {
    try {
      const planId = req.params.id;
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del plan es requerido en los parámetros.'
        });
      }

      const plan = await this.membershipPlanService.getPlanById(planId);
      res.status(200).json({
        success: true,
        plan
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener el plan de membresía.', res);
    }
  }

  /**
   * Activate a membership plan
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async activatePlan(req: Request, res: Response) {
    try {
      const planId = req.params.id;
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del plan es requerido en los parámetros.'
        });
      }

      const plan = await this.membershipPlanService.activatePlan(planId);
      res.status(200).json({
        success: true,
        message: 'Plan de membresía activado exitosamente.',
        plan
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al activar el plan de membresía.', res);
    }
  }

  /**
   * Deactivate a membership plan
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async deactivatePlan(req: Request, res: Response) {
    try {
      const planId = req.params.id;
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del plan es requerido en los parámetros.'
        });
      }

      const plan = await this.membershipPlanService.deactivatePlan(planId);
      res.status(200).json({
        success: true,
        message: 'Plan de membresía desactivado exitosamente.',
        plan
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al desactivar el plan de membresía.', res);
    }
  }

  /**
   * Get all active membership plans
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getActivePlans(req: Request, res: Response) {
    try {
      const plans = await this.membershipPlanService.getActivePlans();
      res.status(200).json({
        success: true,
        plans
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener los planes de membresía activos.', res);
    }
  }

  /**
   * Get all disabled membership plans
   * @async
   * @param req 
   * @param res 
   * @returns 
   */
  async getDisabledPlans(req: Request, res: Response) {
    try {
      const plans = await this.membershipPlanService.getDisabledPlans();
      res.status(200).json({
        success: true,
        plans
      });
    } catch (err: unknown) {
      handleControllerError(err, 'Error al obtener los planes de membresía desactivados.', res);
    }
  }
}
