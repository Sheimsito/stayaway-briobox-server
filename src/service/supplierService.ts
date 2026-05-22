import { SupplierDAO } from '../dao/supplierDAO.js';
import type { SupplierRow, SupplierInsert, SupplierUpdate } from '../types/database.js';

export class SupplierService {
  private dao = new SupplierDAO();

  async create(data: SupplierInsert): Promise<SupplierRow> {
    return this.dao.create(data);
  }

  async getAll(page: number = 1, limit: number = 10): Promise<SupplierRow[]> {
    const offset = (page - 1) * limit;
    return this.dao.list({ limit, offset });
  }

  async getById(id: number): Promise<SupplierRow> {
    return this.dao.findById(id);
  }

  async update(id: number, data: SupplierUpdate): Promise<SupplierRow> {
    return this.dao.updateById(id, data);
  }

  // Soft delete: set is_active to false
  async delete(id: number): Promise<boolean> {
    await this.dao.updateById(id, { is_active: false } as SupplierUpdate);
    return true;
  }
}
