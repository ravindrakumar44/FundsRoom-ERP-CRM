import { Prisma, ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { generateChallanNumber } from '../utils/challanNumber';
import {
  CreateChallanInput,
  UpdateChallanInput,
  ChallanQueryParams,
} from '../validators/challan.validator';
import { PaginatedResult } from '../types';

export class ChallanService {
  static async getAll(query: ChallanQueryParams): Promise<PaginatedResult<any>> {
    const { page, limit, search, status, customerId, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ChallanWhereInput = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { customerName: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
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

    const orderBy: Prisma.ChallanOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [totalItems, challans] = await Promise.all([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              customerName: true,
              businessName: true,
              mobile: true,
              email: true,
              customerType: true,
              gstNumber: true,
              address: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          items: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: challans,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  static async getById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                sku: true,
                currentStock: true,
                warehouseLocation: true,
              },
            },
          },
        },
      },
    });

    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    return challan;
  }

  static async create(input: CreateChallanInput, userId: string) {
    const { customerId, status = ChallanStatus.DRAFT, notes, items } = input;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Fetch product information to create snapshot
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new AppError('One or more selected products could not be found', 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Generate unique sequential challan number
    const challanNumber = await generateChallanNumber();

    // Prepare snapshot items and compute totals
    let totalQuantity = 0;
    let totalAmount = 0;

    const snapshotItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.unitPrice);
      const lineTotal = unitPrice * item.quantity;

      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      return {
        productId: product.id,
        productNameSnapshot: product.productName,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
      };
    });

    // If status is CONFIRMED, perform atomic stock deduction
    if (status === ChallanStatus.CONFIRMED) {
      return await prisma.$transaction(async (tx) => {
        // Check stock for all items
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new AppError(`Product with ID ${item.productId} not found`, 404);
          }

          if (product.currentStock < item.quantity) {
            throw new AppError(
              `Insufficient stock for "${product.productName}". Available: ${product.currentStock}, requested: ${item.quantity}.`,
              400
            );
          }
        }

        // Deduct stock and record movements
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.OUT,
              reason: `Sales Challan confirmed: ${challanNumber}`,
              createdBy: userId,
            },
          });
        }

        // Create confirmed challan
        const createdChallan = await tx.challan.create({
          data: {
            challanNumber,
            customerId,
            status: ChallanStatus.CONFIRMED,
            totalQuantity,
            totalAmount,
            notes: notes || null,
            createdBy: userId,
            items: {
              create: snapshotItems,
            },
          },
          include: {
            customer: true,
            items: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return createdChallan;
      });
    }

    // Otherwise create DRAFT challan
    const createdChallan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        totalAmount,
        notes: notes || null,
        createdBy: userId,
        items: {
          create: snapshotItems,
        },
      },
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return createdChallan;
  }

  static async updateDraft(id: string, input: UpdateChallanInput) {
    const existing = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError('Challan not found', 404);
    }

    if (existing.status !== ChallanStatus.DRAFT) {
      throw new AppError(
        `Cannot edit a ${existing.status.toLowerCase()} challan. Only DRAFT challans can be modified.`,
        400
      );
    }

    if (input.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }
    }

    // If new items are provided, recompute snapshots and totals
    if (input.items && input.items.length > 0) {
      const productIds = input.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== input.items.length) {
        throw new AppError('One or more selected products could not be found', 400);
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalQuantity = 0;
      let totalAmount = 0;

      const snapshotItems = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = Number(product.unitPrice);
        const lineTotal = unitPrice * item.quantity;

        totalQuantity += item.quantity;
        totalAmount += lineTotal;

        return {
          productId: product.id,
          productNameSnapshot: product.productName,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
        };
      });

      // Update in transaction: delete old items, insert new items, update totals
      return await prisma.$transaction(async (tx) => {
        await tx.challanItem.deleteMany({
          where: { challanId: id },
        });

        const updated = await tx.challan.update({
          where: { id },
          data: {
            ...(input.customerId && { customerId: input.customerId }),
            ...(input.notes !== undefined && { notes: input.notes || null }),
            totalQuantity,
            totalAmount,
            items: {
              create: snapshotItems,
            },
          },
          include: {
            customer: true,
            items: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return updated;
      });
    }

    // Simple update without item changes
    const updated = await prisma.challan.update({
      where: { id },
      data: {
        ...(input.customerId && { customerId: input.customerId }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  static async confirm(id: string, userId: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      throw new AppError('Challan is already confirmed.', 400);
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new AppError('Cannot confirm a cancelled challan.', 400);
    }

    if (challan.items.length === 0) {
      throw new AppError('Cannot confirm an empty challan.', 400);
    }

    // Critical Atomic Transaction
    const confirmed = await prisma.$transaction(async (tx) => {
      // Step 1: Check stock for all items
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new AppError(`Product "${item.productNameSnapshot}" no longer exists in inventory`, 404);
        }

        if (product.currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.productName}". Available: ${product.currentStock}, requested: ${item.quantity}.`,
            400
          );
        }
      }

      // Step 2: Deduct stock and create OUT stock movements
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan confirmed: ${challan.challanNumber}`,
            createdBy: userId,
          },
        });
      }

      // Step 3: Transition status DRAFT -> CONFIRMED
      const updatedChallan = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED,
        },
        include: {
          customer: true,
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return updatedChallan;
    });

    return confirmed;
  }

  static async cancel(id: string, userId: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new AppError('Challan is already cancelled.', 400);
    }

    // If challan was CONFIRMED, we must atomically restore the inventory stock and log IN movements
    if (challan.status === ChallanStatus.CONFIRMED) {
      const cancelled = await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.IN,
              reason: `Cancelled Challan stock restoration: ${challan.challanNumber}`,
              createdBy: userId,
            },
          });
        }

        const updated = await tx.challan.update({
          where: { id },
          data: { status: ChallanStatus.CANCELLED },
          include: {
            customer: true,
            items: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return updated;
      });

      return cancelled;
    }

    // If challan was DRAFT, simply mark as CANCELLED (no stock change)
    const cancelled = await prisma.challan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return cancelled;
  }
}
