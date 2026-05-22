import { Request, Response } from 'express';
import { CashRegisterService } from '../service/cashRegisterService.js';
import config from '../config/config.js';

/**
 * Maps cash register error messages to appropriate HTTP status codes.
 * @param err - The caught error.
 * @param defaultMessage - Fallback message when error is not an Error instance.
 * @param res - Express response object.
 * @returns HTTP response with structured error payload.
 */
function handleError(err: unknown, defaultMessage: string, res: Response) {
  if (config.nodeEnv === 'development') {
    console.error(err);
  }

  const message = err instanceof Error ? err.message : defaultMessage;
  let status = 500;

  if (message.includes('no existe') || message.includes('no encontrado')) status = 404;
  else if (
    message.includes('inválido') ||
    message.includes('debe ser') ||
    message.includes('obligatoria') ||
    message.includes('mayor') ||
    message.includes('igual a cero')
  ) status = 400;
  else if (
    message.includes('ya existe') ||
    message.includes('ya fue cerrada') ||
    message.includes('ya cerrada')
  ) status = 409;

  return res.status(status).json({ success: false, message });
}

export default class CashRegisterController {
  private cashRegisterService: CashRegisterService;

  constructor(cashRegisterService: CashRegisterService) {
    this.cashRegisterService = cashRegisterService;
  }

  /**
   * Opens a new cash register session.
   * Body: { openingBalance: number, notes?: string }
   * @async
   */
  async openSession(req: Request, res: Response) {
    try {
      const { openingBalance, notes } = req.body;
      const openedBy = (req as any).user?.userId;

      if (openingBalance === undefined || openingBalance === null) {
        return res.status(400).json({
          success: false,
          message: 'El campo openingBalance es obligatorio.',
        });
      }

      const session = await this.cashRegisterService.openSession({
        openedBy: Number(openedBy),
        openingBalance: Number(openingBalance),
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'Caja abierta exitosamente.',
        data: session,
      });
    } catch (err) {
      return handleError(err, 'Error al abrir la caja.', res);
    }
  }

  /**
   * Retrieves the current open session with its full summary.
   * @async
   */
  async getCurrentSession(req: Request, res: Response) {
    try {
      const summary = await this.cashRegisterService.getCurrentSession();
      return res.status(200).json({ success: true, data: summary });
    } catch (err) {
      return handleError(err, 'Error al obtener la sesión actual.', res);
    }
  }

  /**
   * Retrieves the full summary of a specific session by ID.
   * @async
   */
  async getSessionById(req: Request, res: Response) {
    try {
      const sessionId = Number(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ success: false, message: 'El ID de sesión es inválido.' });
      }

      const summary = await this.cashRegisterService.getSessionSummary(sessionId);
      return res.status(200).json({ success: true, data: summary });
    } catch (err) {
      return handleError(err, 'Error al obtener la sesión.', res);
    }
  }

  /**
   * Adds a manual movement (income or expense) to an open session.
   * Body: { sessionId: number, movementType: string, amount: number, description: string }
   * @async
   */
  async addMovement(req: Request, res: Response) {
    try {
      const { sessionId, movementType, amount, description, referenceType, referenceId } = req.body;
      const createdBy = (req as any).user?.userId;

      if (!sessionId || !movementType || amount === undefined || !description) {
        return res.status(400).json({
          success: false,
          message: 'Los campos sessionId, movementType, amount y description son obligatorios.',
        });
      }

      const movement = await this.cashRegisterService.addMovement({
        sessionId: Number(sessionId),
        createdBy: Number(createdBy),
        movementType,
        amount: Number(amount),
        description,
        referenceType,
        referenceId: referenceId ? Number(referenceId) : undefined,
      });

      return res.status(201).json({
        success: true,
        message: 'Movimiento registrado exitosamente.',
        data: movement,
      });
    } catch (err) {
      return handleError(err, 'Error al registrar el movimiento.', res);
    }
  }

  /**
   * Closes the current open cash register session.
   * Body: { sessionId: number, closingBalance: number, notes?: string }
   * @async
   */
  async closeSession(req: Request, res: Response) {
    try {
      const { sessionId, closingBalance, notes } = req.body;
      const closedBy = (req as any).user?.userId;

      if (!sessionId || closingBalance === undefined || closingBalance === null) {
        return res.status(400).json({
          success: false,
          message: 'Los campos sessionId y closingBalance son obligatorios.',
        });
      }

      const summary = await this.cashRegisterService.closeSession({
        sessionId: Number(sessionId),
        closedBy: Number(closedBy),
        closingBalance: Number(closingBalance),
        notes,
      });

      return res.status(200).json({
        success: true,
        message: 'Caja cerrada exitosamente.',
        data: summary,
      });
    } catch (err) {
      return handleError(err, 'Error al cerrar la caja.', res);
    }
  }

  /**
   * Lists all sessions with optional date range filter.
   * Query params: from (ISO date), to (ISO date)
   * @async
   */
  async listSessions(req: Request, res: Response) {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const sessions = await this.cashRegisterService.listSessions(from, to);
      return res.status(200).json({ success: true, data: sessions });
    } catch (err) {
      return handleError(err, 'Error al listar las sesiones.', res);
    }
  }
}