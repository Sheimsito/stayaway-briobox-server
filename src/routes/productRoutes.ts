import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', requirePermission('products.manage'), createProduct);
router.put('/:id', requirePermission('products.manage'), updateProduct);
router.delete('/:id', requirePermission('products.manage'), deleteProduct);

export default router;