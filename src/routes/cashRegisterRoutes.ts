import { Router } from 'express';
import CashRegisterController from '../controllers/cashRegisterController.js';
import { CashRegisterService } from '../service/cashRegisterService.js';
import { authenticateToken, requireEmployeeRole } from '../middleware/auth.js';

const router = Router();
const cashRegisterService = new CashRegisterService();
const cashRegisterController = new CashRegisterController(cashRegisterService);

router.post('/open', authenticateToken, requireEmployeeRole, cashRegisterController.openSession.bind(cashRegisterController));
router.get('/current', authenticateToken, requireEmployeeRole, cashRegisterController.getCurrentSession.bind(cashRegisterController));
router.post('/movements', authenticateToken, requireEmployeeRole, cashRegisterController.addMovement.bind(cashRegisterController));
router.post('/close', authenticateToken, requireEmployeeRole, cashRegisterController.closeSession.bind(cashRegisterController));
router.get('/sessions', authenticateToken, requireEmployeeRole, cashRegisterController.listSessions.bind(cashRegisterController));
router.get('/sessions/:id', authenticateToken, requireEmployeeRole, cashRegisterController.getSessionById.bind(cashRegisterController));

export default router;