import { userPermissionDAO } from '../dao/userPermissionDAO.js';
import { userDAO } from '../dao/userDAO.js';
import type { UserPermissionRow } from '../types/database.js';

export const AVAILABLE_PERMISSIONS = [
  'cash_register.open',
  'cash_register.close',
  'cash_register.movements',
  'cash_register.view',
  'memberships.create',
  'memberships.manage',
  'payments.register',
  'users.create',
  'users.manage',
  'clients.manage',
] as const;

export type Permission = typeof AVAILABLE_PERMISSIONS[number];

export class UserPermissionService {
  /**
   * Grants a permission to a user. Only admins can perform this action.
   * @param targetUserId - The user who will receive the permission.
   * @param permission - The permission string to grant.
   * @param grantedBy - The admin user ID performing the action.
   * @returns The created permission row.
   */
  async grantPermission(
    targetUserId: number,
    permission: string,
    grantedBy: number
  ): Promise<UserPermissionRow> {
    const targetUser = await userDAO.findById(targetUserId);
    if (!targetUser || targetUser.is_deleted) {
      throw new Error('El usuario al que deseas asignar el permiso no existe o fue eliminado.');
    }

    if (targetUser.role === 'admin') {
      throw new Error('Los administradores ya tienen acceso completo. No es necesario asignarles permisos.');
    }

    if (!AVAILABLE_PERMISSIONS.includes(permission as Permission)) {
      throw new Error(
        `Permiso inválido: '${permission}'. Los permisos disponibles son: ${AVAILABLE_PERMISSIONS.join(', ')}.`
      );
    }

    const already = await userPermissionDAO.hasPermission(targetUserId, permission);
    if (already) {
      throw new Error(`El usuario ya tiene el permiso '${permission}'.`);
    }

    return userPermissionDAO.create({
      user_id: targetUserId,
      permission,
      granted_by: grantedBy,
    });
  }

  /**
   * Revokes a permission from a user.
   * @param targetUserId - The user whose permission will be revoked.
   * @param permission - The permission string to revoke.
   * @returns True if the permission was removed.
   */
  async revokePermission(targetUserId: number, permission: string): Promise<boolean> {
    const targetUser = await userDAO.findById(targetUserId);
    if (!targetUser || targetUser.is_deleted) {
      throw new Error('El usuario no existe o fue eliminado.');
    }

    const removed = await userPermissionDAO.revokePermission(targetUserId, permission);
    if (!removed) {
      throw new Error(`El usuario no tenía el permiso '${permission}'.`);
    }

    return true;
  }

  /**
   * Returns all permissions assigned to a specific user.
   * @param targetUserId - The user ID to query.
   * @returns Array of permission rows.
   */
  async getPermissionsByUser(targetUserId: number): Promise<UserPermissionRow[]> {
    const targetUser = await userDAO.findById(targetUserId);
    if (!targetUser || targetUser.is_deleted) {
      throw new Error('El usuario no existe o fue eliminado.');
    }

    return userPermissionDAO.findByUserId(targetUserId);
  }

  /**
   * Returns the full list of available permissions in the system.
   * @returns Array of permission strings.
   */
  getAvailablePermissions(): string[] {
    return [...AVAILABLE_PERMISSIONS];
  }
}