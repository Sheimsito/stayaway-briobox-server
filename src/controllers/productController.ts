import { Request, Response } from 'express';
import { ProductService } from '../service/productService.js';
import { UserRole } from '../types/database.js';

const service = new ProductService();

export const createProduct = async (req: any, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    const product = await service.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message ?? 'Error interno' });
  }
};

export const getProducts = async (req: any, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { data: products, count } = await service.getAll(page, limit);
  res.json({ success: true, products, count, page, limit });
};

export const getProductById = async (req: any, res: Response) => {
  const product = await service.getById(Number(req.params.id));
  res.json({ success: true, product });
};

export const updateProduct = async (req: any, res: Response) => {
  const role = req.user?.role;
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  const product = await service.update(Number(req.params.id), req.body);
  res.json({ success: true, product });
};

export const deleteProduct = async (req: any, res: Response) => {
  const role = req.user?.role;
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  await service.delete(Number(req.params.id));
  res.json({ success: true, message: 'Producto eliminado' });
};
