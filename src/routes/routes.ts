import { Router } from 'express';
import userRoutes from './userRoutes.js';
import { authenticateToken } from '../middleware/auth.js';
import authRoutes from './authRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import cashRegisterRoutes from './cashRegisterRoutes.js';
import productRoutes from './productRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import userPermissionRoutes from './userPermissionRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', authenticateToken, userRoutes);
router.use('/memberships', authenticateToken, membershipRoutes);
router.use('/payments', authenticateToken, paymentRoutes);
router.use('/cash-register', authenticateToken, cashRegisterRoutes);
router.use('/products', authenticateToken, productRoutes);
router.use('/suppliers', authenticateToken, supplierRoutes);
router.use('/permissions', userPermissionRoutes);

export default router;