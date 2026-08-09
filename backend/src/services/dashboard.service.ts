import { prisma } from '../config/prisma';
import { ChallanStatus, MovementType, CustomerStatus } from '@prisma/client';

export class DashboardService {
  static async getStats() {
    const [
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      cancelledChallans,
      pendingFollowUps,
      recentChallans,
      recentMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.customer.count({ where: { status: CustomerStatus.LEAD } }),
      prisma.product.count(),
      prisma.product.findMany({
        select: {
          id: true,
          productName: true,
          sku: true,
          category: true,
          currentStock: true,
          minimumStock: true,
          warehouseLocation: true,
        },
      }),
      prisma.challan.count(),
      prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.challan.count({ where: { status: ChallanStatus.CANCELLED } }),
      prisma.customer.count({
        where: {
          followUpDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              customerName: true,
              businessName: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              productName: true,
              sku: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate stock breakdown
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockAlerts = allProducts
      .filter((p) => {
        if (p.currentStock <= 0) {
          outOfStockCount++;
          return true;
        }
        if (p.currentStock <= p.minimumStock) {
          lowStockCount++;
          return true;
        }
        return false;
      })
      .slice(0, 8);

    // Customer Distribution by Type
    const [retailCount, wholesaleCount, distributorCount] = await Promise.all([
      prisma.customer.count({ where: { customerType: 'RETAIL' } }),
      prisma.customer.count({ where: { customerType: 'WHOLESALE' } }),
      prisma.customer.count({ where: { customerType: 'DISTRIBUTOR' } }),
    ]);

    const customerDistribution = [
      { name: 'Retail', value: retailCount, color: '#4f46e5' },
      { name: 'Wholesale', value: wholesaleCount, color: '#06b6d4' },
      { name: 'Distributor', value: distributorCount, color: '#8b5cf6' },
    ];

    // Challan Status Breakdown
    const challanStatusBreakdown = [
      { name: 'Confirmed', count: confirmedChallans, color: '#10b981' },
      { name: 'Draft', count: draftChallans, color: '#f59e0b' },
      { name: 'Cancelled', count: cancelledChallans, color: '#ef4444' },
    ];

    // Upcoming Follow-ups (nearest 5)
    const upcomingFollowUps = await prisma.customer.findMany({
      where: {
        followUpDate: {
          not: null,
        },
      },
      orderBy: { followUpDate: 'asc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        businessName: true,
        mobile: true,
        followUpDate: true,
        status: true,
        notes: true,
      },
    });

    // Stock Movement Volume by Type (recent aggregated)
    const [inMovementsSum, outMovementsSum] = await Promise.all([
      prisma.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { movementType: MovementType.IN },
      }),
      prisma.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { movementType: MovementType.OUT },
      }),
    ]);

    // Monthly Challan Activity (Last 6 Months)
    const allChallans = await prisma.challan.findMany({
      select: {
        createdAt: true,
        totalAmount: true,
        totalQuantity: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; confirmedRevenue: number; draftRevenue: number; quantity: number }>();

    // Initialize recent 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap.set(key, { month: key, confirmedRevenue: 0, draftRevenue: 0, quantity: 0 });
    }

    allChallans.forEach((ch) => {
      const d = new Date(ch.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key)!;
        const amount = Number(ch.totalAmount);
        if (ch.status === ChallanStatus.CONFIRMED) {
          item.confirmedRevenue += amount;
          item.quantity += ch.totalQuantity;
        } else if (ch.status === ChallanStatus.DRAFT) {
          item.draftRevenue += amount;
        }
      }
    });

    const challansOverTime = Array.from(monthlyMap.values());

    return {
      kpis: {
        totalCustomers,
        activeCustomers,
        leadCustomers,
        totalProducts,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        totalChallans,
        confirmedChallans,
        pendingFollowUps,
        totalInStockUnits: inMovementsSum._sum.quantity || 0,
        totalOutStockUnits: outMovementsSum._sum.quantity || 0,
      },
      charts: {
        challansOverTime,
        customerDistribution,
        challanStatusBreakdown,
        stockMovementSummary: [
          { type: 'Stock Inflow (IN)', units: inMovementsSum._sum.quantity || 0, fill: '#10b981' },
          { type: 'Dispatched Outflow (OUT)', units: outMovementsSum._sum.quantity || 0, fill: '#6366f1' },
        ],
      },
      lowStockAlerts,
      upcomingFollowUps,
      recentChallans,
      recentMovements,
    };
  }
}
