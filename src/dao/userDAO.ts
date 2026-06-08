import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import bcrypt from 'bcrypt';
import type { UserRow, UserInsert, UserUpdate, UserRole } from '../types/database.js';

/**
 * User Data Access Object
 * Handles all database operations for users table
 */
export class UserDAO extends BaseDAO<UserRow, UserInsert, UserUpdate> {
  constructor() {
    super('users');
  }

  async create(user: UserInsert): Promise<UserRow> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userCreated = await super.create({ ...user, password: hashedPassword });
    return userCreated;
  }

  // This is the create method
  /**
   * Find a user by email
   * @param email - User email address
   * @returns User data or null if not found
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*') // mejor evitar '*'
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error(`[UserDAO] findByEmail failed for ${email}:`, error.message);
      throw new Error(`[users] findByEmail: ${error.message}`);
    }

    return (data as UserRow | null) ?? null;
  }

  async updateResetPasswordJti(userId: string, jwtid: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      // @ts-ignore
      .update({ resetPasswordJti: jwtid })
      .eq('id', userId);

    if (error) {
      console.error(`[UserDAO] updateResetPasswordJti failed for ${userId}:`, error.message);
      throw new Error(`[users] updateResetPasswordJti: ${error.message}`);
    }
  }

  async getUserRole(userId: string): Promise<UserRole | null> {                 
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[UserDAO] getUserRole failed for ${userId}:`, error.message);
      throw new Error(`[users] getUserRole: ${error.message}`);
    }

    return (data as { role: UserRole } | null)?.role ?? null;
  }

  /**
   * Find a user profile by ID without sensitive data (password, reset tokens)
   * Useful for sending data back to the client securely.
   */
  async findSafeProfileById(id: string | number): Promise<Omit<UserRow, 'password' | 'resetPasswordJti'>> {
    const user = await this.findById(id);
    const { password, resetPasswordJti, ...safeProfile } = user;
    return safeProfile;
  }
}



export const userDAO = new UserDAO();
