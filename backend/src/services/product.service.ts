import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
} from '../validators/product.validator';
import { PaginatedResult } from '../types';

export class ProductService {
  static async getAll(query: ProductQueryParams): Promise<PaginatedResult<any>> {
    const { page, limit, search, category, stockStatus, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { warehouseLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        where.currentStock = { lte: 0 };
      } else if (stockStatus === 'LOW_STOCK') {
        // currentStock > 0 AND currentStock <= minimumStock
        where.AND = [
          { currentStock: { gt: 0 } },
          {
            // In Prisma, column-to-column comparison: we can filter or post-filter if needed,
            // or we can use raw query or handle with direct conditions.
            // Let's also check currentStock lte minimumStock.
          },
        ];
      } else if (stockStatus === 'IN_STOCK') {
        where.currentStock = { gt: 0 };
      }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    let [totalItems, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              stockMovements: true,
              challanItems: true,
            },
          },
        },
      }),
    ]);

    // Enhanced stock status computed property
    let processedProducts = products.map((prod) => {
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (prod.currentStock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (prod.currentStock <= prod.minimumStock) {
        status = 'LOW_STOCK';
      }

      return {
        ...prod,
        stockStatus: status,
      };
    });

    if (stockStatus === 'LOW_STOCK') {
      processedProducts = processedProducts.filter((p) => p.stockStatus === 'LOW_STOCK');
      totalItems = processedProducts.length;
    } else if (stockStatus === 'IN_STOCK') {
      processedProducts = processedProducts.filter((p) => p.stockStatus === 'IN_STOCK');
      totalItems = processedProducts.length;
    }

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: processedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (product.currentStock <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (product.currentStock <= product.minimumStock) {
      status = 'LOW_STOCK';
    }

    return {
      ...product,
      stockStatus: status,
    };
  }

  static async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        currentStock: {
          lte: 100, // safety upperBound for low stock query
        },
      },
      orderBy: { currentStock: 'asc' },
    });

    const lowStock = products
      .filter((p) => p.currentStock <= p.minimumStock)
      .map((p) => ({
        ...p,
        stockStatus: p.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      }));

    return lowStock;
  }

  static async create(input: CreateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { sku: input.sku },
    });

    if (existing) {
      throw new AppError(`A product with SKU '${input.sku}' already exists`, 409);
    }

    const product = await prisma.product.create({
      data: {
        productName: input.productName,
        sku: input.sku,
        category: input.category,
        unitPrice: input.unitPrice,
        currentStock: input.currentStock,
        minimumStock: input.minimumStock,
        warehouseLocation: input.warehouseLocation || null,
      },
    });

    return product;
  }

  static async update(id: string, input: UpdateProductInput) {
    await this.getById(id);

    if (input.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          sku: input.sku,
          NOT: { id },
        },
      });

      if (existing) {
        throw new AppError(`A product with SKU '${input.sku}' already exists`, 409);
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(input.productName && { productName: input.productName }),
        ...(input.sku && { sku: input.sku }),
        ...(input.category && { category: input.category }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
        ...(input.currentStock !== undefined && { currentStock: input.currentStock }),
        ...(input.minimumStock !== undefined && { minimumStock: input.minimumStock }),
        ...(input.warehouseLocation !== undefined && { warehouseLocation: input.warehouseLocation || null }),
      },
    });

    return updated;
  }

  static async delete(id: string) {
    await this.getById(id);

    // Check if product is in any challans or stock movements
    const [challanItemCount, movementCount] = await Promise.all([
      prisma.challanItem.count({ where: { productId: id } }),
      prisma.stockMovement.count({ where: { productId: id } }),
    ]);

    if (challanItemCount > 0 || movementCount > 0) {
      throw new AppError(
        'Cannot delete product that has existing challan items or stock history. Consider updating stock to 0 instead.',
        400
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}
