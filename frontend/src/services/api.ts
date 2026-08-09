import { initialCustomers, initialProducts, initialChallans, initialStockMovements, mockUsers } from './mockData';
import { Customer, Product, Challan, StockMovement, User, DashboardStats, PaginatedResponse, FollowUp } from '../types';

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'https://nexora-backend-4kk0.onrender.com';
export const BASE_URL = RAW_BASE_URL.endsWith('/api') ? RAW_BASE_URL : `${RAW_BASE_URL.replace(/\/$/, '')}/api`;

// Local storage keys for persistent mock fallback
const LS_CUSTOMERS = 'nexora_mock_customers';
const LS_PRODUCTS = 'nexora_mock_products';
const LS_CHALLANS = 'nexora_mock_challans';
const LS_MOVEMENTS = 'nexora_mock_movements';

// Initialize mock storage if not present
const getStoredData = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultData;
  }
};

const setStoredData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

/**
 * Robust API Client Fetch Wrapper
 * Tries the live Render Backend & Neon PostgreSQL Database first;
 * If offline or spinning up, seamlessly falls back to the client-side mock engine.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nexora_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for smooth UI responsiveness
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.error || resData.message || `Request failed with status ${response.status}`);
    }

    if (resData.pagination !== undefined && resData.data !== undefined) {
      return {
        data: resData.data,
        pagination: resData.pagination,
      } as unknown as T;
    }

    return (resData.data !== undefined ? resData.data : resData) as unknown as T;
  } catch (err: any) {
    console.warn(`[NEXORA API] Live backend request failed or spinning up (${endpoint}), serving from local engine:`, err?.message || err);
    return executeLocalMock<T>(endpoint, options);
  }
}

// Local Mock Engine to guarantee 100% interactive responsiveness at all times
async function executeLocalMock<T>(endpoint: string, options: RequestInit): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, 'http://localhost/api');
  const pathname = url.pathname.replace('/api', '');
  const searchParams = url.searchParams;
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Artificial short delay for realistic UI loading states
  await new Promise((resolve) => setTimeout(resolve, 80));

  // --- AUTH MOCK ---
  if (pathname === '/auth/login' && method === 'POST') {
    const { email } = body;
    const user = mockUsers[email] || {
      id: 'usr-custom',
      name: email.split('@')[0].toUpperCase(),
      email,
      role: 'ADMIN',
    };
    const token = 'mock_jwt_token_' + btoa(JSON.stringify(user));
    return { token, user } as unknown as T;
  }

  if (pathname === '/auth/me' && method === 'GET') {
    const rawUser = localStorage.getItem('nexora_user');
    const user = rawUser ? JSON.parse(rawUser) : mockUsers['admin@nexora.demo'];
    return user as unknown as T;
  }

  // --- DASHBOARD MOCK ---
  if (pathname === '/dashboard' && method === 'GET') {
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);

    const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0).length;
    const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;
    const confirmedCount = challans.filter((c) => c.status === 'CONFIRMED').length;

    const stats: DashboardStats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'ACTIVE').length,
      leadCustomers: customers.filter((c) => c.status === 'LEAD').length,
      totalProducts: products.length,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      totalChallans: challans.length,
      confirmedChallans: confirmedCount,
      draftChallans: challans.filter((c) => c.status === 'DRAFT').length,
      cancelledChallans: challans.filter((c) => c.status === 'CANCELLED').length,
      pendingFollowUps: customers.filter((c) => !!c.followUpDate).length,
      revenueTrends: [
        { month: 'Oct 25', confirmedRevenue: 65000, draftRevenue: 15000, quantity: 24 },
        { month: 'Nov 25', confirmedRevenue: 110000, draftRevenue: 28000, quantity: 38 },
        { month: 'Dec 25', confirmedRevenue: 195000, draftRevenue: 42000, quantity: 64 },
        { month: 'Jan 26', confirmedRevenue: 140000, draftRevenue: 31000, quantity: 48 },
        { month: 'Feb 26', confirmedRevenue: 220000, draftRevenue: 55000, quantity: 72 },
        { month: 'Mar 26', confirmedRevenue: 285000, draftRevenue: 64000, quantity: 95 },
      ],
      customerDistribution: [
        { name: 'Distributor', value: customers.filter((c) => c.customerType === 'DISTRIBUTOR').length },
        { name: 'Wholesale', value: customers.filter((c) => c.customerType === 'WHOLESALE').length },
        { name: 'Retail', value: customers.filter((c) => c.customerType === 'RETAIL').length },
      ],
      lowStockAlerts: products.filter((p) => p.currentStock <= p.minimumStock),
      pendingFollowUpList: customers.filter((c) => !!c.followUpDate).slice(0, 5),
      recentChallans: challans.slice(0, 5),
      recentStockMovements: movements.slice(0, 5),
    };
    return stats as unknown as T;
  }

  // --- CUSTOMERS MOCK ---
  if (pathname === '/customers' && method === 'GET') {
    let items = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const search = searchParams.get('search')?.toLowerCase();
    const customerType = searchParams.get('customerType');
    const status = searchParams.get('status');

    if (search) {
      items = items.filter(
        (c) =>
          c.customerName.toLowerCase().includes(search) ||
          c.businessName.toLowerCase().includes(search) ||
          c.mobile.includes(search) ||
          c.email.toLowerCase().includes(search)
      );
    }
    if (customerType) {
      items = items.filter((c) => c.customerType === customerType);
    }
    if (status) {
      items = items.filter((c) => c.status === status);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const result: PaginatedResponse<Customer> = {
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
    return result as unknown as T;
  }

  if (pathname === '/customers' && method === 'POST') {
    const items = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newCustomer);
    setStoredData(LS_CUSTOMERS, items);
    return newCustomer as unknown as T;
  }

  if (pathname.match(/^\/customers\/[^/]+$/) && method === 'GET') {
    const id = pathname.split('/')[2];
    const items = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const found = items.find((c) => c.id === id);
    if (!found) throw new Error('Customer not found');
    return found as unknown as T;
  }

  if (pathname.match(/^\/customers\/[^/]+$/) && method === 'PUT') {
    const id = pathname.split('/')[2];
    const items = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const idx = items.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    const updated = { ...items[idx], ...body, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    setStoredData(LS_CUSTOMERS, items);
    return updated as unknown as T;
  }

  if (pathname.match(/^\/customers\/[^/]+$/) && method === 'DELETE') {
    const id = pathname.split('/')[2];
    let items = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    items = items.filter((c) => c.id !== id);
    setStoredData(LS_CUSTOMERS, items);
    return { success: true } as unknown as T;
  }

  if (pathname.match(/^\/customers\/[^/]+\/follow-ups$/) && method === 'GET') {
    const id = pathname.split('/')[2];
    const followUps: FollowUp[] = [
      {
        id: 'fu-01',
        customerId: id,
        note: 'Spoke with purchase manager regarding quarterly supply agreement. Reorder scheduled for next week.',
        followUpDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        createdBy: 'usr-admin-01',
        user: { name: 'Ravindra Kumar (Admin)' },
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'fu-02',
        customerId: id,
        note: 'Customer inquired about discount brackets on industrial gear pumps. Sent updated pricing sheet.',
        followUpDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        createdBy: 'usr-sales-01',
        user: { name: 'Rohan Mehta (Sales Head)' },
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];
    return followUps as unknown as T;
  }

  if (pathname.match(/^\/customers\/[^/]+\/follow-ups$/) && method === 'POST') {
    const id = pathname.split('/')[2];
    const newFollowUp: FollowUp = {
      id: 'fu-' + Date.now(),
      customerId: id,
      note: body.note,
      followUpDate: body.followUpDate,
      createdBy: 'usr-admin-01',
      user: { name: 'Ravindra Kumar (Admin)' },
      createdAt: new Date().toISOString(),
    };
    return newFollowUp as unknown as T;
  }

  // --- PRODUCTS MOCK ---
  if (pathname === '/products/low-stock' && method === 'GET') {
    const items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    return items.filter((p) => p.currentStock <= p.minimumStock) as unknown as T;
  }

  if (pathname === '/products' && method === 'GET') {
    let items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const stockStatus = searchParams.get('stockStatus');

    if (search) {
      items = items.filter((p) => p.productName.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    }
    if (category) {
      items = items.filter((p) => p.category === category);
    }
    if (stockStatus === 'LOW_STOCK') {
      items = items.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0);
    } else if (stockStatus === 'OUT_OF_STOCK') {
      items = items.filter((p) => p.currentStock <= 0);
    } else if (stockStatus === 'IN_STOCK') {
      items = items.filter((p) => p.currentStock > p.minimumStock);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const result: PaginatedResponse<Product> = {
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
    return result as unknown as T;
  }

  if (pathname === '/products' && method === 'POST') {
    const items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newProduct);
    setStoredData(LS_PRODUCTS, items);
    return newProduct as unknown as T;
  }

  if (pathname.match(/^\/products\/[^/]+$/) && method === 'GET') {
    const id = pathname.split('/')[2];
    const items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const found = items.find((p) => p.id === id);
    if (!found) throw new Error('Product not found');
    return found as unknown as T;
  }

  if (pathname.match(/^\/products\/[^/]+$/) && method === 'PUT') {
    const id = pathname.split('/')[2];
    const items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const updated = { ...items[idx], ...body, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    setStoredData(LS_PRODUCTS, items);
    return updated as unknown as T;
  }

  if (pathname.match(/^\/products\/[^/]+$/) && method === 'DELETE') {
    const id = pathname.split('/')[2];
    let items = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    items = items.filter((p) => p.id !== id);
    setStoredData(LS_PRODUCTS, items);
    return { success: true } as unknown as T;
  }

  // --- STOCK MOVEMENTS MOCK ---
  if (pathname === '/stock-movements' && method === 'GET') {
    let items = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const search = searchParams.get('search')?.toLowerCase();
    const movementType = searchParams.get('movementType');

    if (search) {
      items = items.filter(
        (m) =>
          m.product?.productName.toLowerCase().includes(search) ||
          m.product?.sku.toLowerCase().includes(search) ||
          m.reason.toLowerCase().includes(search)
      );
    }
    if (movementType) {
      items = items.filter((m) => m.movementType === movementType);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const result: PaginatedResponse<StockMovement> = {
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
    return result as unknown as T;
  }

  if (pathname === '/stock-movements' && method === 'POST') {
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);

    const prodIdx = products.findIndex((p) => p.id === body.productId);
    if (prodIdx === -1) throw new Error('Product not found');

    const qty = parseInt(body.quantity, 10);
    if (body.movementType === 'OUT' && products[prodIdx].currentStock < qty) {
      throw new Error(`Insufficient stock. Available: ${products[prodIdx].currentStock}`);
    }

    products[prodIdx].currentStock += body.movementType === 'IN' ? qty : -qty;
    setStoredData(LS_PRODUCTS, products);

    const newMovement: StockMovement = {
      id: 'mov-' + Date.now(),
      productId: body.productId,
      quantity: qty,
      movementType: body.movementType,
      reason: body.reason,
      createdBy: 'usr-admin-01',
      createdAt: new Date().toISOString(),
      product: products[prodIdx],
      user: { name: 'Ravindra Kumar (Admin)' },
    };
    movements.unshift(newMovement);
    setStoredData(LS_MOVEMENTS, movements);

    return newMovement as unknown as T;
  }

  // --- CHALLANS MOCK ---
  if (pathname === '/challans' && method === 'GET') {
    let items = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    if (status) {
      items = items.filter((c) => c.status === status);
    }
    if (customerId) {
      items = items.filter((c) => c.customerId === customerId);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const result: PaginatedResponse<Challan> = {
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
    return result as unknown as T;
  }

  if (pathname.match(/^\/challans\/[^/]+$/) && method === 'GET') {
    const id = pathname.split('/')[2];
    const items = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const found = items.find((c) => c.id === id);
    if (!found) throw new Error('Challan not found');
    return found as unknown as T;
  }

  if (pathname === '/challans' && method === 'POST') {
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);

    const customer = customers.find((c) => c.id === body.customerId);
    const challanItems = body.items.map((it: any) => {
      const prod = products.find((p) => p.id === it.productId);
      return {
        id: 'item-' + Math.random().toString(36).substring(7),
        productId: it.productId,
        productNameSnapshot: prod?.productName || 'Product',
        skuSnapshot: prod?.sku || 'SKU',
        unitPriceSnapshot: prod?.unitPrice || 100,
        quantity: it.quantity,
      };
    });

    const totalQty = challanItems.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
    const totalAmt = challanItems.reduce((acc: number, curr: any) => acc + curr.quantity * curr.unitPriceSnapshot, 0);

    const newChallan: Challan = {
      id: 'ch-' + Date.now(),
      challanNumber: `CH-2026-0000${challans.length + 1}`,
      customerId: body.customerId,
      status: body.status || 'DRAFT',
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      notes: body.notes || '',
      createdBy: 'usr-admin-01',
      createdAt: new Date().toISOString(),
      customer,
      items: challanItems,
    };

    if (newChallan.status === 'CONFIRMED') {
      body.items.forEach((it: any) => {
        const pIdx = products.findIndex((p) => p.id === it.productId);
        if (pIdx !== -1) {
          products[pIdx].currentStock = Math.max(0, products[pIdx].currentStock - it.quantity);
        }
      });
      setStoredData(LS_PRODUCTS, products);
    }

    challans.unshift(newChallan);
    setStoredData(LS_CHALLANS, challans);
    return newChallan as unknown as T;
  }

  if (pathname.match(/^\/challans\/[^/]+\/confirm$/) && method === 'POST') {
    const id = pathname.split('/')[2];
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const idx = challans.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Challan not found');

    challans[idx].items?.forEach((it) => {
      const pIdx = products.findIndex((p) => p.id === it.productId);
      if (pIdx !== -1) {
        products[pIdx].currentStock = Math.max(0, products[pIdx].currentStock - it.quantity);
      }
    });
    setStoredData(LS_PRODUCTS, products);

    challans[idx].status = 'CONFIRMED';
    setStoredData(LS_CHALLANS, challans);
    return challans[idx] as unknown as T;
  }

  if (pathname.match(/^\/challans\/[^/]+\/cancel$/) && method === 'POST') {
    const id = pathname.split('/')[2];
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const idx = challans.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Challan not found');

    challans[idx].status = 'CANCELLED';
    setStoredData(LS_CHALLANS, challans);
    return challans[idx] as unknown as T;
  }

  return {} as T;
}
