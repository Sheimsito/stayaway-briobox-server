import { Request, Response } from 'express';
import { SupplierService } from '../service/supplierService.js';
import { userDAO } from '../dao/userDAO.js';
import { UserRole } from '../types/database.js';

const service = new SupplierService();

export const createSupplier = async (req: any, res: Response) => {
  try {
    const role = await userDAO.getUserRole(req.user.userId);
    if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    console.log(req.body);
    const { name, email, address, nit, phone } = req.body;

    if (!name || !email || !address || !nit || !phone) {
      console.log('!name', !name, '!email', !email, '!address', !address, '!nit', !nit, '!phone', !phone);
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos del proveedor' });
    }

    const nitRegex = /^\d{8,10}-\d$/;
    if (!nitRegex.test(nit)) {
      return res.status(400).json({ success: false, message: 'Formato de NIT inválido' });
    }

    const phoneRegex = /^3\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Formato de teléfono inválido' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Formato de correo electrónico inválido' });
    }

    const supplierData = {
      name,
      email,
      address,
      nit,
      phone
    };

    const supplier = await service.create(supplierData);
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
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const role = await userDAO.getUserRole(req.user.userId);
    if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const { name, email, address, nit, phone, is_active } = req.body;

    if (nit !== undefined) {
      const nitRegex = /^\d{8,10}-\d$/;

      if (!nitRegex.test(nit)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de NIT inválido'
        });
      }
    }

    if (phone !== undefined) {
      const phoneRegex = /^3\d{9}$/;

      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de teléfono inválido'
        });
      }
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de correo electrónico inválido'
        });
      }
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Formato de is_active inválido'
      });
    }

    const supplierData = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(nit !== undefined && { nit }),
      ...(phone !== undefined && { phone }),
      ...(is_active !== undefined && { is_active })
    };

    if (Object.keys(supplierData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      });
    }

    const supplier = await service.update(
      Number(req.params.id),
      supplierData
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    return res.json({
      success: true,
      supplier
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message ?? 'Error interno'
    });
  }
};

export const deleteSupplier = async (req: any, res: Response) => {
  const role = await userDAO.getUserRole(req.user.userId);
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  await service.delete(Number(req.params.id));
  res.json({ success: true, message: 'Proveedor eliminado' });
};
