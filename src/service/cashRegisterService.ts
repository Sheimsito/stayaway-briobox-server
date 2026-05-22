import { CashRegisterDAO } from '../dao/cashRegisterDAO.js';
import type {
  CashRegisterSessionRow,
  CashRegisterMovementRow,
} from '../types/database.js';

export type MovementType = 'ingreso' | 'egreso';

export interface OpenSessionInput {
  openedBy: number;
  openingBalance: number;
  notes?: string;
}

export interface AddMovementInput {
  sessionId: number;
  createdBy: number;
  movementType: MovementType;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: number;
}

export interface CloseSessionInput {
  sessionId: number;
  closedBy: number;
  closingBalance: number;
  notes?: string;
}

export interface SessionSummary {
  session: CashRegisterSessionRow;
  movements: CashRegisterMovementRow[];
  totalIncome: number;
  totalExpense: number;
  expectedBalance: number;
  difference: number | null;
}

const VALID_MOVEMENT_TYPES: MovementType[] = ['ingreso', 'egreso'];

export class CashRegisterService {
  private cashRegisterDAO: CashRegisterDAO;

  constructor() {
    this.cashRegisterDAO = new CashRegisterDAO();
  }

  /**
   * Opens a new cash register session.
   * Throws if there is already an open session.
   * @param input - Object containing openedBy user ID and openingBalance.
   * @returns The created session row.
   */
  async openSession(input: OpenSessionInput): Promise<CashRegisterSessionRow> {
    const existing = await this.cashRegisterDAO.findOpenSession();
    if (existing) {
      throw new Error(
        `Ya existe una caja abierta (ID: ${existing.id}). Debe cerrarla antes de abrir una nueva.`
      );
    }

    if (typeof input.openingBalance !== 'number' || input.openingBalance < 0) {
      throw new Error('El monto inicial debe ser un número mayor o igual a cero.');
    }

    return this.cashRegisterDAO.create({
      opened_by: input.openedBy,
      opening_balance: input.openingBalance,
      notes: input.notes ?? null,
    });
  }

  /**
   * Adds a manual movement (income or expense) to an open session.
   * @param input - Movement details including type, amount and description.
   * @returns The created movement row.
   */
  async addMovement(input: AddMovementInput): Promise<CashRegisterMovementRow> {
    if (!VALID_MOVEMENT_TYPES.includes(input.movementType)) {
      throw new Error(
        `Tipo de movimiento inválido: '${input.movementType}'. Los tipos válidos son: ${VALID_MOVEMENT_TYPES.join(', ')}.`
      );
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new Error('El monto del movimiento debe ser mayor a cero.');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('La descripción del movimiento es obligatoria.');
    }

    const session = await this.cashRegisterDAO.findById(input.sessionId);
    if (!session) {
      throw new Error('La sesión de caja especificada no existe.');
    }

    if ((session as CashRegisterSessionRow).closed_at !== null) {
      throw new Error('No se pueden agregar movimientos a una sesión de caja ya cerrada.');
    }

    return this.cashRegisterDAO.createMovement({
      session_id: input.sessionId,
      created_by: input.createdBy,
      movement_type: input.movementType,
      amount: input.amount,
      description: input.description.trim(),
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
    });
  }

  /**
   * Retrieves the full summary of a session including movements and balance calculations.
   * @param sessionId - The bigint ID of the session.
   * @returns SessionSummary with totals, expected balance and difference (when closed).
   */
  async getSessionSummary(sessionId: number): Promise<SessionSummary> {
    const session = await this.cashRegisterDAO.findById(sessionId);
    if (!session) {
      throw new Error('La sesión de caja especificada no existe.');
    }

    const typedSession = session as CashRegisterSessionRow;
    const movements = await this.cashRegisterDAO.findMovementsBySession(sessionId);

    const totalIncome = parseFloat(
      movements
        .filter((m) => m.movement_type === 'ingreso')
        .reduce((sum, m) => sum + m.amount, 0)
        .toFixed(2)
    );

    const totalExpense = parseFloat(
      movements
        .filter((m) => m.movement_type === 'egreso')
        .reduce((sum, m) => sum + m.amount, 0)
        .toFixed(2)
    );

    const expectedBalance = parseFloat(
      (typedSession.opening_balance + totalIncome - totalExpense).toFixed(2)
    );

    const difference =
      typedSession.closing_balance !== null
        ? parseFloat((typedSession.closing_balance - expectedBalance).toFixed(2))
        : null;

    return {
      session: typedSession,
      movements,
      totalIncome,
      totalExpense,
      expectedBalance,
      difference,
    };
  }

  /**
   * Closes an open cash register session and computes the final difference.
   * @param input - Object containing sessionId, closedBy user ID and closingBalance.
   * @returns The full summary of the closed session.
   */
  async closeSession(input: CloseSessionInput): Promise<SessionSummary> {
    const session = await this.cashRegisterDAO.findById(input.sessionId);
    if (!session) {
      throw new Error('La sesión de caja especificada no existe.');
    }

    if ((session as CashRegisterSessionRow).closed_at !== null) {
      throw new Error('Esta sesión de caja ya fue cerrada.');
    }

    if (typeof input.closingBalance !== 'number' || input.closingBalance < 0) {
      throw new Error('El monto de cierre debe ser un número mayor o igual a cero.');
    }

    await this.cashRegisterDAO.closeSession(
      input.sessionId,
      input.closedBy,
      input.closingBalance,
      input.notes
    );

    return this.getSessionSummary(input.sessionId);
  }

  /**
   * Retrieves the current open session summary or throws if no session is open.
   * @returns The summary of the currently open session.
   */
  async getCurrentSession(): Promise<SessionSummary> {
    const session = await this.cashRegisterDAO.findOpenSession();
    if (!session) {
      throw new Error('No hay una sesión de caja abierta en este momento.');
    }

    return this.getSessionSummary(session.id);
  }

  /**
   * Retrieves all sessions with optional date range filter and their movement summaries.
   * @param from - Optional ISO date string to filter sessions from.
   * @param to - Optional ISO date string to filter sessions until.
   * @returns Array of SessionSummary objects.
   */
  async listSessions(from?: string, to?: string): Promise<SessionSummary[]> {
    const sessions = await this.cashRegisterDAO.findSessions(from, to);

    return Promise.all(sessions.map((s) => this.getSessionSummary(s.id)));
  }
}