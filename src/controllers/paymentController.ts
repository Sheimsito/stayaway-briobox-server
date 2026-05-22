import { Request, Response } from 'express';
import { PaymentService } from '../service/paymentService.js';
import config from '../config/config.js';

/**
 * Maps payment error messages to appropriate HTTP status codes.
 * @param err - The caught error.
 * @param defaultMessage - Fallback message when error is not an Error instance.
 * @param res - Express response object.
 * @returns HTTP response with structured error payload.
 */
function handlePaymentError(err: unknown, defaultMessage: string, res: Response) {
  if (config.nodeEnv === 'development') {
    console.error(err);
  }

  let message = err instanceof Error ? err.message : defaultMessage;
  let status = 500;

  if (
    message.includes('no existe') ||
    message.includes('no encontrado') ||
    message.includes('no encontrada')
  ) {
    status = 404;
  } else if (
    message.includes('inválido') ||
    message.includes('debe') ||
    message.includes('Debe') ||
    message.includes('mayor a cero') ||
    message.includes('supera el total') ||
    message.includes('al menos')
  ) {
    status = 400;
  } else if (message.includes('cancelada')) {
    status = 409;
  }

  return res.status(status).json({ success: false, message });
}

export default class PaymentController {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  /**
   * Registers a new membership payment supporting fractional payments across multiple methods.
   * Expected body: { membershipId: number, splits: [{ method, amount, reference? }] }
   * @async
   * @param req - Express request.
   * @param res - Express response.
   */
  async registerPayment(req: Request, res: Response) {
    try {
      const { membershipId, splits } = req.body;
      const createdBy = (req as any).user?.id ?? null;

      if (!membershipId) {
        return res.status(400).json({
          success: false,
          message: 'El campo membershipId es obligatorio.',
        });
      }

      const parsedMembershipId = Number(membershipId);
      if (isNaN(parsedMembershipId)) {
        return res.status(400).json({
          success: false,
          message: 'El campo membershipId debe ser un número válido.',
        });
      }

      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un método de pago en el campo splits.',
        });
      }

      const result = await this.paymentService.registerPayment({
        membershipId: parsedMembershipId,
        splits,
        createdBy: createdBy ? Number(createdBy) : null,
      });

      return res.status(201).json({
        success: true,
        message: result.receipt.isPaidInFull
          ? 'Pago registrado exitosamente. Membresía activada.'
          : 'Pago parcial registrado exitosamente.',
        payment: result.payment,
        splits: result.splits,
        receipt: result.receipt,
      });
    } catch (err: unknown) {
      return handlePaymentError(err, 'Error al registrar el pago.', res);
    }
  }

  /**
   * Retrieves all payments for a given membership including each payment's splits.
   * @async
   * @param req - Express request with membershipId in params.
   * @param res - Express response.
   */
  async getPaymentsByMembership(req: Request, res: Response) {
    try {
      const parsedId = Number(req.params.membershipId);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro membershipId debe ser un número válido.',
        });
      }

      const payments = await this.paymentService.getPaymentsByMembership(parsedId);

      return res.status(200).json({ success: true, payments });
    } catch (err: unknown) {
      return handlePaymentError(err, 'Error al obtener los pagos de la membresía.', res);
    }
  }

  /**
   * Retrieves a single payment by its ID including its splits.
   * @async
   * @param req - Express request with paymentId in params.
   * @param res - Express response.
   */
  async getPaymentById(req: Request, res: Response) {
    try {
      const parsedId = Number(req.params.paymentId);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro paymentId debe ser un número válido.',
        });
      }

      const result = await this.paymentService.getPaymentById(parsedId);

      return res.status(200).json({
        success: true,
        payment: result.payment,
        splits: result.splits,
      });
    } catch (err: unknown) {
      return handlePaymentError(err, 'Error al obtener el pago.', res);
    }
  }
}