import { Router } from 'express';
import CashRegisterController from '../controllers/cashRegisterController.js';
import { CashRegisterService } from '../service/cashRegisterService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new CashRegisterController(new CashRegisterService());

router.use(authenticateToken);

router.post('/open', (req, res) => controller.openSession(req, res));
router.get('/current', (req, res) => controller.getCurrentSession(req, res));
router.get('/sessions', (req, res) => controller.listSessions(req, res));
router.get('/sessions/:id', (req, res) => controller.getSessionById(req, res));
router.post('/movements', (req, res) => controller.addMovement(req, res));
router.post('/close', (req, res) => controller.closeSession(req, res));

export default router;