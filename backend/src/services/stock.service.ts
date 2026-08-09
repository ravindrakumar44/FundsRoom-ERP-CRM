import { Prisma, MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import {
  CreateStockMovementInput,
  StockMovementQueryParams,
} from '../validators/stock.validator';
import { PaginatedResult } from '../types';

export class StockService {
  static async getAll(query: StockMovementQueryParams): Promise<PaginatedResult<any>> {
    const { page, limit, productId, movementType, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { product: { productName: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [totalItems, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              productName: true,
              sku: true,
              category: true,
              currentStock: true,
              warehouseLocation: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: movements,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  static async recordMovement(input: CreateStockMovementInput, userId: string) {
    const { productId, quantity, movementType, reason } = input;

    // Use Prisma transaction for atomic check and stock update
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (movementType === MovementType.OUT) {
        if (product.currentStock < quantity) {
          throw new AppError(
            `Insufficient stock for "${product.productName}". Available: ${product.currentStock}, requested: ${quantity}.`,
            400
          );
        }
      }

      const stockDelta = movementType === MovementType.IN ? quantity : -quantity;
      const newStock = product.currentStock + stockDelta;

      // Update product currentStock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          createdBy: userId,
        },
        include: {
          product: {
            select: {
              id: true,
              productName: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return { movement, updatedProduct };
    });

    return result;
  }
}
