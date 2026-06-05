import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import type { UserPermissionRow, UserPermissionInsert, UserPermissionUpdate } from '../types/database.js';

export class UserPermissionDAO extends BaseDAO<UserPermissionRow, UserPermissionInsert, UserPermissionUpdate> {
  constructor() {
    super('user_permissions');
  }

  /**
   * Returns all permissions assigned to a specific user.
   * @param userId - The user ID to query permissions for.
   * @returns Array of permission rows.
   */
  async findByUserId(userId: number): Promise<UserPermissionRow[]> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`[user_permissions] findByUserId: ${error.message}`);
    return (data as UserPermissionRow[]) ?? [];
  }

  /**
   * Checks whether a user has a specific permission.
   * @param userId - The user ID to check.
   * @param permission - The permission string to look for.
   * @returns True if the permission exists, false otherwise.
   */
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .eq('permission', permission)
      .maybeSingle();

    if (error) throw new Error(`[user_permissions] hasPermission: ${error.message}`);
    return data !== null;
  }

  /**
   * Removes a specific permission from a user.
   * @param userId - The user ID.
   * @param permission - The permission string to revoke.
   * @returns True if a row was deleted, false if it did not exist.
   */
  async revokePermission(userId: number, permission: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('user_permissions')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .eq('permission', permission);

    if (error) throw new Error(`[user_permissions] revokePermission: ${error.message}`);
    return (count ?? 0) > 0;
  }
}

export const userPermissionDAO = new UserPermissionDAO();