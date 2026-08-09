import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
  CreateFollowUpInput,
} from '../validators/customer.validator';
import { PaginatedResult } from '../types';

export class CustomerService {
  static async getAll(query: CustomerQueryParams): Promise<PaginatedResult<any>> {
    const { page, limit, search, type, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.customerType = type;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [totalItems, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              challans: true,
              followUps: true,
            },
          },
          followUps: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              note: true,
              followUpDate: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: customers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  static async create(input: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data: {
        customerName: input.customerName,
        mobile: input.mobile,
        email: input.email || null,
        businessName: input.businessName || null,
        gstNumber: input.gstNumber || null,
        customerType: input.customerType,
        address: input.address || null,
        status: input.status,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        notes: input.notes || null,
      },
    });

    return customer;
  }

  static async update(id: string, input: UpdateCustomerInput) {
    await this.getById(id);

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.customerName && { customerName: input.customerName }),
        ...(input.mobile && { mobile: input.mobile }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.businessName !== undefined && { businessName: input.businessName || null }),
        ...(input.gstNumber !== undefined && { gstNumber: input.gstNumber || null }),
        ...(input.customerType && { customerType: input.customerType }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.status && { status: input.status }),
        ...(input.followUpDate !== undefined && {
          followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
    });

    return updated;
  }

  static async delete(id: string) {
    await this.getById(id);

    // Check if customer has confirmed challans
    const challanCount = await prisma.challan.count({
      where: { customerId: id },
    });

    if (challanCount > 0) {
      throw new AppError('Cannot delete customer with existing sales challans. Set status to INACTIVE instead.', 400);
    }

    await prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  static async getFollowUps(customerId: string) {
    await this.getById(customerId);

    const followUps = await prisma.followUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return followUps;
  }

  static async createFollowUp(customerId: string, input: CreateFollowUpInput, userId: string) {
    await this.getById(customerId);

    const followUpDate = new Date(input.followUpDate);

    // Create follow-up note and update customer's next follow-up date atomically
    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          customerId,
          note: input.note,
          followUpDate,
          createdBy: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: {
          followUpDate,
        },
      }),
    ]);

    return followUp;
  }
}
