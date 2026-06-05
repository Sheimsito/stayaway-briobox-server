import { Router } from 'express';
import CashRegisterController from '../controllers/cashRegisterController.js';
import { CashRegisterService } from '../service/cashRegisterService.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();
const cashRegisterService = new CashRegisterService();
const cashRegisterController = new CashRegisterController(cashRegisterService);

router.post('/open',         authenticateToken, requirePermission('cash_register.open'),      cashRegisterController.openSession.bind(cashRegisterController));
router.get('/current',       authenticateToken, requirePermission('cash_register.view'),      cashRegisterController.getCurrentSession.bind(cashRegisterController));
router.post('/movements',    authenticateToken, requirePermission('cash_register.movements'), cashRegisterController.addMovement.bind(cashRegisterController));
router.post('/close',        authenticateToken, requirePermission('cash_register.close'),     cashRegisterController.closeSession.bind(cashRegisterController));
router.get('/sessions',      authenticateToken, requirePermission('cash_register.view'),      cashRegisterController.listSessions.bind(cashRegisterController));
router.get('/sessions/:id',  authenticateToken, requirePermission('cash_register.view'),      cashRegisterController.getSessionById.bind(cashRegisterController));

export default router;