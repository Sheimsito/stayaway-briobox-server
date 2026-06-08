import { Router } from 'express';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', requirePermission('suppliers.manage'), createSupplier);
router.put('/:id', requirePermission('suppliers.manage'), updateSupplier);
router.delete('/:id', requirePermission('suppliers.manage'), deleteSupplier);

export default router;