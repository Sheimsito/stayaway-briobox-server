import { BaseDAO } from './baseDAO.js';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import bcrypt from 'bcrypt';
import type { ClientRow, ClientInsert, ClientUpdate } from '../types/database.js';

/**
 * Client Data Access Object
 * Handles all database operations for clients table
 */
export class ClientDAO extends BaseDAO<ClientRow, ClientInsert, ClientUpdate> {
  constructor() {
    super('clients');
  }

  async create(client: ClientInsert): Promise<ClientRow> {
    const clientCreated = await super.create({ ...client });
    return clientCreated;
  }

  // This is the create method
  /**
   * Find a client by email
   * @param email - Client email address
   * @returns Client data or null if not found
   */
  async findByEmail(email: string): Promise<ClientRow | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*') // mejor evitar '*'
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error(`[ClientDAO] findByEmail failed for ${email}:`, error.message);
      throw new Error(`[clients] findByEmail: ${error.message}`);
    }

    return (data as ClientRow | null) ?? null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<ClientRow | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*') // mejor evitar '*'
      .eq('phoneNumber', phoneNumber)
      .maybeSingle();

    if (error) {
      console.error(`[ClientDAO] findByPhoneNumber failed for ${phoneNumber}:`, error.message);
      throw new Error(`[clients] findByPhoneNumber: ${error.message}`);
    }

    return (data as ClientRow | null) ?? null;
  }

  async updateResetPasswordJti(userId: string, jwtid: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      // @ts-ignore
      .update({ resetPasswordJti: jwtid })
      .eq('id', userId);
      
    if (error) {
      console.error(`[ClientDAO] updateResetPasswordJti failed for ${userId}:`, error.message);
      throw new Error(`[clients] updateResetPasswordJti: ${error.message}`);
    }
  }
}

export const clientDAO = new ClientDAO();
