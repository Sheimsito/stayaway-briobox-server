import { Request, Response } from 'express';
import { ProductService } from '../service/productService.js';
import { UserRole } from '../types/database.js';
import { userDAO } from '../dao/userDAO.js'
import { SupplierService } from '../service/supplierService.js';

const service = new ProductService();
const supplierService = new SupplierService();

export const createProduct = async (req: any, res: Response) => {
  try {
    const role = await userDAO.getUserRole(req.user.userId);
    if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    const { name, price, stock, supplier_id } = req.body;
    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (
      !name ||
      Number.isNaN(priceNumber) ||
      Number.isNaN(stockNumber) 
     
    ) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos'
      });
    }
    const supplier = await supplierService.findActiveSuppliers(supplier_id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    const productData = { // CHANGE THIS WHEN ADD TYPES ON CONTROLLERS
      name,
      price,
      stock,
      supplier_id
    };
    const product = await service.create(productData);
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

    const { name, price, stock, supplier_id, is_active } = req.body;

    if (price !== undefined) {
      const priceNumber = Number(price);

      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Precio inválido'
        });
      }
    }

    if (stock !== undefined) {
      const stockNumber = Number(stock);

      if (Number.isNaN(stockNumber) || stockNumber < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock inválido'
        });
      }
    }
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_active debe ser un valor booleano'
        });
      }
    }

    if (supplier_id !== undefined) {
      const supplier = await supplierService.findActiveSuppliers(
        supplier_id
      );

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
    }

    const productData = {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(supplier_id !== undefined && {
        supplier_id: Number(supplier_id)
      }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) })
    };

    if (Object.keys(productData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      });
    }

    const product = await service.update(
      Number(req.params.id),
      productData
    );


    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    return res.json({
      success: true,
      product
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message ?? 'Error interno'
    });
  }
};

export const deleteProduct = async (req: any, res: Response) => {
  const role = await userDAO.getUserRole(req.user.userId);
  if (role !== UserRole.ADMIN && role !== UserRole.EMPLEADO) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  await service.delete(Number(req.params.id));
  res.json({ success: true, message: 'Producto eliminado' });
};

export const sellProduct = async (req: any, res: Response) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID de producto inválido' });
    }

    const { quantity } = req.body;
    const quantityNumber = Number(quantity);

    if (!quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Cantidad inválida' });
    }

    const product = await service.sell(productId, quantityNumber);

    return res.status(200).json({ success: true, message: 'Venta registrada', product });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message ?? 'Error al procesar venta' });
  }
};