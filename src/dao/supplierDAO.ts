import { BaseDAO } from './baseDAO.js';
import type { SupplierRow, SupplierInsert, SupplierUpdate } from '../types/database.js';

export class SupplierDAO extends BaseDAO<SupplierRow, SupplierInsert, SupplierUpdate> {
  constructor() {
    super('suppliers');
  }
}
