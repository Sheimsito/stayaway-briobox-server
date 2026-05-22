import { PaymentDAO } from '../dao/paymentDAO.js';
import { MembershipDAO } from '../dao/membershipDAO.js';
import { MembershipPlanDAO } from '../dao/membershipPlanDAO.js';
import type { PaymentRow, PaymentSplitRow, PaymentSplitInsert } from '../types/database.js';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface PaymentSplitInput {
  payment_method: PaymentMethod;
  amount: number;
}

export interface RegisterPaymentInput {
  membershipId: number;
  splits: PaymentSplitInput[];
  createdBy: number | null;
  notes?: string;
}

export interface PaymentReceipt {
  paymentId: number;
  customerId: number;
  membershipId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaidInFull: boolean;
  createdAt: Date;
  splits: Array<{
    payment_method: PaymentMethod;
    amount: number;
  }>;
}

export interface PaymentResult {
  payment: PaymentRow;
  splits: PaymentSplitRow[];
  receipt: PaymentReceipt;
}

const VALID_METHODS: PaymentMethod[] = ['efectivo', 'transferencia', 'tarjeta', 'otro'];

export class PaymentService {
  private paymentDAO: PaymentDAO;
  private membershipDAO: MembershipDAO;
  private membershipPlanDAO: MembershipPlanDAO;

  constructor() {
    this.paymentDAO = new PaymentDAO();
    this.membershipDAO = new MembershipDAO();
    this.membershipPlanDAO = new MembershipPlanDAO();
  }

  /**
   * Registers a membership payment with support for fractional payments across multiple methods.
   * Updates membership status to 'activa' when the paid amount covers the full plan price.
   * @param input - Object containing membershipId, splits array, createdBy user ID and optional notes.
   * @returns The created payment, its splits and a receipt object.
   */
  async registerPayment(input: RegisterPaymentInput): Promise<PaymentResult> {
    const { membershipId, splits, createdBy, notes } = input;

    if (!splits || splits.length === 0) {
      throw new Error('Debe proporcionar al menos un método de pago.');
    }

    for (const split of splits) {
      if (!VALID_METHODS.includes(split.payment_method)) {
        throw new Error(
          `Método de pago inválido: '${split.payment_method}'. Los métodos válidos son: ${VALID_METHODS.join(', ')}.`
        );
      }
      if (typeof split.amount !== 'number' || split.amount <= 0) {
        throw new Error('Cada método de pago debe tener un monto mayor a cero.');
      }
    }

    const membership = await this.membershipDAO.findById(membershipId);
    if (!membership) {
      throw new Error('La membresía especificada no existe.');
    }

    if (membership.status === 'cancelada') {
      throw new Error('No se puede registrar un pago sobre una membresía cancelada.');
    }

    const plan = await this.membershipPlanDAO.findById(membership.plan_id);
    if (!plan) {
      throw new Error('El plan de la membresía no existe.');
    }

    const totalAmount = plan.price;
    const paidAmount = parseFloat(
      splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)
    );

    if (paidAmount > totalAmount) {
      throw new Error(
        `El monto pagado (${paidAmount}) supera el total del plan (${totalAmount}).`
      );
    }

    const remainingAmount = parseFloat((totalAmount - paidAmount).toFixed(2));
    const isPaidInFull = remainingAmount === 0;

    const splitPayloads: Omit<PaymentSplitInsert, 'payment_id'>[] = splits.map((s) => ({
      payment_method: s.payment_method,
      amount: s.amount,
    }));

    const { payment, splits: createdSplits } = await this.paymentDAO.createWithSplits(
      {
        created_by: createdBy,
        customer_id: membership.customer_id,
        total_amount: paidAmount,
        reference_type: 'membership',
        reference_id: membershipId,
        notes: notes ?? null,
      },
      splitPayloads
    );

    if (isPaidInFull && membership.status !== 'activa') {
      await this.membershipDAO.update(String(membershipId), { status: 'activa' });
    }

    const receipt: PaymentReceipt = {
      paymentId: payment.id,
      customerId: payment.customer_id,
      membershipId,
      totalAmount,
      paidAmount: payment.total_amount,
      remainingAmount,
      isPaidInFull,
      createdAt: payment.created_at,
      splits: createdSplits.map((s) => ({
        payment_method: s.payment_method as PaymentMethod,
        amount: s.amount,
      })),
    };

    return { payment, splits: createdSplits, receipt };
  }

  /**
   * Retrieves all payments linked to a given membership via reference_type and reference_id.
   * @param membershipId - The bigint ID of the membership.
   * @returns Array of objects each containing a payment and its associated splits.
   */
  async getPaymentsByMembership(
    membershipId: number
  ): Promise<Array<{ payment: PaymentRow; splits: PaymentSplitRow[] }>> {
    const membership = await this.membershipDAO.findById(membershipId);
    if (!membership) {
      throw new Error('La membresía especificada no existe.');
    }

    const allPayments = await this.paymentDAO.findByCustomerId(membership.customer_id);
    const membershipPayments = allPayments.filter(
      (p) => p.reference_type === 'membership' && p.reference_id === membershipId
    );

    return Promise.all(
      membershipPayments.map(async (payment) => {
        const splits = await this.paymentDAO.findSplitsByPaymentId(payment.id);
        return { payment, splits };
      })
    );
  }

  /**
   * Retrieves a single payment by its ID along with its splits.
   * @param paymentId - The bigint ID of the payment.
   * @returns The payment row and its associated splits.
   */
  async getPaymentById(
    paymentId: number
  ): Promise<{ payment: PaymentRow; splits: PaymentSplitRow[] }> {
    const payment = await this.paymentDAO.findById(paymentId);
    if (!payment) {
      throw new Error('El pago especificado no existe.');
    }

    const splits = await this.paymentDAO.findSplitsByPaymentId(payment.id);

    return { payment, splits };
  }
}