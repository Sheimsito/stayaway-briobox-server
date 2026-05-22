import { Router } from 'express';
import PaymentController from '../controllers/paymentController.js';
import { PaymentService } from '../service/paymentService.js';

const router = Router();
const paymentController = new PaymentController(new PaymentService());

router.post('/', paymentController.registerPayment.bind(paymentController));
router.get('/membership/:membershipId', paymentController.getPaymentsByMembership.bind(paymentController));
router.get('/:paymentId', paymentController.getPaymentById.bind(paymentController));

export default router;