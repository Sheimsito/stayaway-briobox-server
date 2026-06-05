import { Router } from 'express';
import { UserPermissionController } from '../controllers/userPermissionController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();
const controller = new UserPermissionController();

router.get('/', authenticateToken, requireAdmin, controller.getAvailablePermissions.bind(controller));
router.get('/:userId', authenticateToken, requireAdmin, controller.getUserPermissions.bind(controller));
router.post('/:userId', authenticateToken, requireAdmin, controller.grantPermission.bind(controller));
router.delete('/:userId/:permission', authenticateToken, requireAdmin, controller.revokePermission.bind(controller));

export default router;