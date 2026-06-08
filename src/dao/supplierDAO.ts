import { BaseDAO } from './baseDAO.js';
import type { SupplierRow, SupplierInsert, SupplierUpdate } from '../types/database.js';
import { supabase } from '../lib/supabaseClient.js';

export class SupplierDAO extends BaseDAO<SupplierRow, SupplierInsert, SupplierUpdate> {
  constructor() {
    super('suppliers');
  }


  async findActiveSuppliers(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .eq('id', id);

    if (error) {
      console.error(`[SupplierDAO] findActiveSuppliers failed:`, error.message);
      throw new Error(`[suppliers] findActiveSuppliers: ${error.message}`);
    }
    if (data?.length === 0) {
      return false;
    }
    else{
      return true;
    }
  }
}
