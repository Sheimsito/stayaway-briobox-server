import { Response } from 'express';
import { UserPermissionService } from '../service/userPermissionService.js';
import { AuthRequest } from '../middleware/auth.js';

export class UserPermissionController {
  private permissionService: UserPermissionService;

  constructor() {
    this.permissionService = new UserPermissionService();
  }

  /**
   * Grants a permission to a target user.
   * @route POST /api/permissions/:userId
   */
  async grantPermission(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetUserId = Number(req.params.userId);
      const { permission } = req.body;
      const grantedBy = Number(req.user?.userId);

      if (!permission || typeof permission !== 'string') {
        res.status(400).json({ success: false, message: 'El campo permission es requerido.' });
        return;
      }

      if (isNaN(targetUserId)) {
        res.status(400).json({ success: false, message: 'El userId debe ser un número válido.' });
        return;
      }

      const result = await this.permissionService.grantPermission(targetUserId, permission, grantedBy);
      res.status(201).json({ success: true, message: 'Permiso asignado correctamente.', data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const status = message.includes('ya tiene') || message.includes('inválido') || message.includes('administradores') ? 400 : 500;
      res.status(status).json({ success: false, message });
    }
  }

  /**
   * Revokes a permission from a target user.
   * @route DELETE /api/permissions/:userId/:permission
   */
  async revokePermission(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetUserId = Number(req.params.userId);
      const { permission } = req.params;

      if (isNaN(targetUserId)) {
        res.status(400).json({ success: false, message: 'El userId debe ser un número válido.' });
        return;
      }

      await this.permissionService.revokePermission(targetUserId, permission);
      res.status(200).json({ success: true, message: `Permiso '${permission}' revocado correctamente.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const status = message.includes('no tenía') || message.includes('no existe') ? 404 : 500;
      res.status(status).json({ success: false, message });
    }
  }

  /**
   * Returns all permissions assigned to a specific user.
   * @route GET /api/permissions/:userId
   */
  async getUserPermissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const targetUserId = Number(req.params.userId);

      if (isNaN(targetUserId)) {
        res.status(400).json({ success: false, message: 'El userId debe ser un número válido.' });
        return;
      }

      const permissions = await this.permissionService.getPermissionsByUser(targetUserId);
      res.status(200).json({ success: true, data: permissions });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Returns the full list of permissions available in the system.
   * @route GET /api/permissions
   */
  async getAvailablePermissions(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const permissions = this.permissionService.getAvailablePermissions();
      res.status(200).json({ success: true, data: permissions });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ success: false, message });
    }
  }
}