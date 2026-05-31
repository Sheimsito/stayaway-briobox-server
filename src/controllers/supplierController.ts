import { Request, Response } from 'express';
import { SupplierService } from '../service/supplierService.js';
import { UserRole } from '../types/database.js';

const service = new SupplierService();

export const createSupplier = async (req: any, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    const supplier = await service.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message ?? 'Error interno' });
  }
};

export const getSuppliers = async (req: any, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { data: suppliers, count } = await service.getAll(page, limit);
  res.json({ success: true, suppliers, count, page, limit });
};

export const getSupplierById = async (req: any, res: Response) => {
  const supplier = await service.getById(Number(req.params.id));
  res.json({ success: true, supplier });
};

export const updateSupplier = async (req: any, res: Response) => {
  const role = req.user?.role;
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  const supplier = await service.update(Number(req.params.id), req.body);
  res.json({ success: true, supplier });
};

export const deleteSupplier = async (req: any, res: Response) => {
  const role = req.user?.role;
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  await service.delete(Number(req.params.id));
  res.json({ success: true, message: 'Proveedor eliminado' });
};
