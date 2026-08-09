export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';

export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type MovementType = 'IN' | 'OUT';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challans?: number;
    followUps?: number;
  };
}

export interface FollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string;
  createdBy: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
  product?: {
    id: string;
    productName: string;
    sku: string;
    currentStock?: number;
    unitPrice?: number;
  };
  user?: {
    id: string;
    name: string;
    role?: Role;
  };
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  product?: Product;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: number;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  user?: User;
  items?: ChallanItem[];
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface DashboardStats {
  kpis: {
    totalCustomers: number;
    activeCustomers: number;
    leadCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalChallans: number;
    confirmedChallans: number;
    pendingFollowUps: number;
    totalInStockUnits: number;
    totalOutStockUnits: number;
  };
  charts: {
    challansOverTime: Array<{
      month: string;
      confirmedRevenue: number;
      draftRevenue: number;
      quantity: number;
    }>;
    customerDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    challanStatusBreakdown: Array<{
      name: string;
      count: number;
      color: string;
    }>;
    stockMovementSummary: Array<{
      type: string;
      units: number;
      fill: string;
    }>;
  };
  lowStockAlerts: Product[];
  upcomingFollowUps: Array<{
    id: string;
    customerName: string;
    businessName: string | null;
    mobile: string;
    followUpDate: string;
    status: CustomerStatus;
    notes: string | null;
  }>;
  recentChallans: Array<Challan & { customer: { customerName: string; businessName: string | null }; user: { name: string } }>;
  recentMovements: Array<StockMovement & { product: { productName: string; sku: string }; user: { name: string } }>;
}
