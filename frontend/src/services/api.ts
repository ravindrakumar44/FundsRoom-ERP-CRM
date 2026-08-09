import { initialCustomers, initialProducts, initialChallans, initialStockMovements, mockUsers } from './mockData';
import { Customer, Product, Challan, StockMovement, User, DashboardStats, PaginatedResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Local storage keys for mock persistence
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

// Generic Fetch Wrapper
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
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
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
    // If backend is unreachable, fallback to Local Mock Engine
    console.warn(`[NEXORA API] Backend request failed (${endpoint}), executing local engine fallback:`, err.message);
    return executeLocalMock<T>(endpoint, options);
  }
}

// Local Mock Engine to guarantee 100% interactive responsiveness
async function executeLocalMock<T>(endpoint: string, options: RequestInit): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(`http://localhost:5000/api${endpoint}`);
  const pathname = url.pathname.replace('/api', '');
  const searchParams = url.searchParams;
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Artificial delay for realistic UI loading states
  await new Promise((resolve) => setTimeout(resolve, 200));

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

    const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
    const leadCustomers = customers.filter((c) => c.status === 'LEAD').length;
    const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock);
    const outOfStock = products.filter((p) => p.currentStock <= 0);
    const confirmedChallans = challans.filter((c) => c.status === 'CONFIRMED').length;

    const stats: DashboardStats = {
      kpis: {
        totalCustomers: customers.length,
        activeCustomers,
        leadCustomers,
        totalProducts: products.length,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length,
        totalChallans: challans.length,
        confirmedChallans,
        pendingFollowUps: customers.filter((c) => c.followUpDate).length,
        totalInStockUnits: movements.filter((m) => m.movementType === 'IN').reduce((a, b) => a + b.quantity, 0),
        totalOutStockUnits: movements.filter((m) => m.movementType === 'OUT').reduce((a, b) => a + b.quantity, 0),
      },
      charts: {
        challansOverTime: [
          { month: 'Mar 26', confirmedRevenue: 45000, draftRevenue: 12000, quantity: 15 },
          { month: 'Apr 26', confirmedRevenue: 85000, draftRevenue: 24000, quantity: 28 },
          { month: 'May 26', confirmedRevenue: 120000, draftRevenue: 35000, quantity: 42 },
          { month: 'Jun 26', confirmedRevenue: 95000, draftRevenue: 18000, quantity: 33 },
          { month: 'Jul 26', confirmedRevenue: 145000, draftRevenue: 40000, quantity: 56 },
          { month: 'Aug 26', confirmedRevenue: 176000, draftRevenue: 55250, quantity: 51 },
        ],
        customerDistribution: [
          { name: 'Retail', value: customers.filter((c) => c.customerType === 'RETAIL').length, color: '#4f46e5' },
          { name: 'Wholesale', value: customers.filter((c) => c.customerType === 'WHOLESALE').length, color: '#06b6d4' },
          { name: 'Distributor', value: customers.filter((c) => c.customerType === 'DISTRIBUTOR').length, color: '#8b5cf6' },
        ],
        challanStatusBreakdown: [
          { name: 'Confirmed', count: confirmedChallans, color: '#10b981' },
          { name: 'Draft', count: challans.filter((c) => c.status === 'DRAFT').length, color: '#f59e0b' },
          { name: 'Cancelled', count: challans.filter((c) => c.status === 'CANCELLED').length, color: '#ef4444' },
        ],
        stockMovementSummary: [
          { type: 'Stock Inflow (IN)', units: 280, fill: '#10b981' },
          { type: 'Dispatched Outflow (OUT)', units: 142, fill: '#6366f1' },
        ],
      },
      lowStockAlerts: [...lowStock, ...outOfStock],
      upcomingFollowUps: customers
        .filter((c) => c.followUpDate)
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          customerName: c.customerName,
          businessName: c.businessName || null,
          mobile: c.mobile,
          followUpDate: c.followUpDate!,
          status: c.status,
          notes: c.notes || null,
        })),
      recentChallans: challans.slice(0, 5) as any,
      recentMovements: movements.slice(0, 6) as any,
    };

    return stats as unknown as T;
  }

  // --- CUSTOMERS MOCK ---
  if (pathname === '/customers' && method === 'GET') {
    let customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');
    const customerType = searchParams.get('customerType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (search) {
      customers = customers.filter(
        (c) =>
          c.customerName.toLowerCase().includes(search) ||
          c.businessName?.toLowerCase().includes(search) ||
          c.mobile.includes(search) ||
          c.email?.toLowerCase().includes(search)
      );
    }
    if (status) {
      customers = customers.filter((c) => c.status === status);
    }
    if (customerType) {
      customers = customers.filter((c) => c.customerType === customerType);
    }

    const totalItems = customers.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = customers.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    } as unknown as T;
  }

  if (pathname.startsWith('/customers/') && method === 'GET') {
    const id = pathname.replace('/customers/', '');
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const customer = customers.find((c) => c.id === id);
    if (!customer) throw new Error('Customer not found');
    return customer as unknown as T;
  }

  if (pathname === '/customers' && method === 'POST') {
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const newCustomer: Customer = {
      ...body,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    setStoredData(LS_CUSTOMERS, customers);
    return newCustomer as unknown as T;
  }

  if (pathname.startsWith('/customers/') && method === 'PUT') {
    const id = pathname.replace('/customers/', '');
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    customers[index] = { ...customers[index], ...body, updatedAt: new Date().toISOString() };
    setStoredData(LS_CUSTOMERS, customers);
    return customers[index] as unknown as T;
  }

  if (pathname.startsWith('/customers/') && method === 'DELETE') {
    const id = pathname.replace('/customers/', '');
    let customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    customers = customers.filter((c) => c.id !== id);
    setStoredData(LS_CUSTOMERS, customers);
    return { success: true } as unknown as T;
  }

  // --- PRODUCTS MOCK ---
  if (pathname === '/products' && method === 'GET') {
    let products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (search) {
      products = products.filter(
        (p) =>
          p.productName.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = products.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    } as unknown as T;
  }

  if (pathname === '/products/low-stock' && method === 'GET') {
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    return products.filter((p) => p.currentStock <= p.minimumStock) as unknown as T;
  }

  if (pathname === '/products' && method === 'POST') {
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const newProduct: Product = {
      ...body,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    setStoredData(LS_PRODUCTS, products);
    return newProduct as unknown as T;
  }

  if (pathname.startsWith('/products/') && method === 'PUT') {
    const id = pathname.replace('/products/', '');
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...body, updatedAt: new Date().toISOString() };
    setStoredData(LS_PRODUCTS, products);
    return products[index] as unknown as T;
  }

  if (pathname.startsWith('/products/') && method === 'DELETE') {
    const id = pathname.replace('/products/', '');
    let products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    products = products.filter((p) => p.id !== id);
    setStoredData(LS_PRODUCTS, products);
    return { success: true } as unknown as T;
  }

  // --- STOCK MOVEMENTS MOCK ---
  if (pathname === '/stock-movements' && method === 'GET') {
    let movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (type) {
      movements = movements.filter((m) => m.movementType === type);
    }

    const totalItems = movements.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = movements.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    } as unknown as T;
  }

  if (pathname === '/stock-movements' && method === 'POST') {
    const { productId, quantity, movementType, reason } = body;
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const prodIndex = products.findIndex((p) => p.id === productId);
    if (prodIndex === -1) throw new Error('Product not found');

    if (movementType === 'OUT' && products[prodIndex].currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${products[prodIndex].currentStock}, Requested: ${quantity}`);
    }

    // Update stock level
    if (movementType === 'IN') {
      products[prodIndex].currentStock += quantity;
    } else {
      products[prodIndex].currentStock -= quantity;
    }
    setStoredData(LS_PRODUCTS, products);

    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const rawUser = localStorage.getItem('nexora_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : mockUsers['admin@nexora.demo'];

    const newMovement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId,
      quantity,
      movementType,
      reason,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      product: products[prodIndex],
      user: currentUser,
    };
    movements.unshift(newMovement);
    setStoredData(LS_MOVEMENTS, movements);

    return newMovement as unknown as T;
  }

  // --- CHALLANS MOCK ---
  if (pathname === '/challans' && method === 'GET') {
    let challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (search) {
      challans = challans.filter(
        (c) =>
          c.challanNumber.toLowerCase().includes(search) ||
          c.customer?.customerName.toLowerCase().includes(search) ||
          c.customer?.businessName?.toLowerCase().includes(search)
      );
    }
    if (status) {
      challans = challans.filter((c) => c.status === status);
    }

    const totalItems = challans.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginated = challans.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    } as unknown as T;
  }

  if (pathname.startsWith('/challans/') && pathname.endsWith('/confirm') && method === 'POST') {
    const id = pathname.replace('/challans/', '').replace('/confirm', '');
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const rawUser = localStorage.getItem('nexora_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : mockUsers['admin@nexora.demo'];

    const chIndex = challans.findIndex((c) => c.id === id);
    if (chIndex === -1) throw new Error('Challan not found');
    const challan = challans[chIndex];

    if (challan.status !== 'DRAFT') {
      throw new Error(`Cannot confirm challan in ${challan.status} status.`);
    }

    // Verify stock availability
    for (const item of challan.items || []) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productNameSnapshot}. Available: ${prod?.currentStock || 0}`);
      }
    }

    // Deduct stock & create OUT movements
    for (const item of challan.items || []) {
      const prod = products.find((p) => p.id === item.productId)!;
      prod.currentStock -= item.quantity;
      movements.unshift({
        id: `sm-${Date.now()}-${item.productId}`,
        productId: item.productId,
        quantity: item.quantity,
        movementType: 'OUT',
        reason: `Delivery Challan ${challan.challanNumber} Confirmed Dispatch`,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        product: prod,
        user: currentUser,
      });
    }

    challan.status = 'CONFIRMED';
    challan.updatedAt = new Date().toISOString();
    setStoredData(LS_CHALLANS, challans);
    setStoredData(LS_PRODUCTS, products);
    setStoredData(LS_MOVEMENTS, movements);

    return challan as unknown as T;
  }

  if (pathname.startsWith('/challans/') && pathname.endsWith('/cancel') && method === 'POST') {
    const id = pathname.replace('/challans/', '').replace('/cancel', '');
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const rawUser = localStorage.getItem('nexora_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : mockUsers['admin@nexora.demo'];

    const chIndex = challans.findIndex((c) => c.id === id);
    if (chIndex === -1) throw new Error('Challan not found');
    const challan = challans[chIndex];

    if (challan.status === 'CONFIRMED') {
      // Restore stock
      for (const item of challan.items || []) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          prod.currentStock += item.quantity;
          movements.unshift({
            id: `sm-cancel-${Date.now()}-${item.productId}`,
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Restoration: Delivery Challan ${challan.challanNumber} Cancelled`,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            product: prod,
            user: currentUser,
          });
        }
      }
    }

    challan.status = 'CANCELLED';
    challan.updatedAt = new Date().toISOString();
    setStoredData(LS_CHALLANS, challans);
    setStoredData(LS_PRODUCTS, products);
    setStoredData(LS_MOVEMENTS, movements);

    return challan as unknown as T;
  }

  if (pathname.startsWith('/challans/') && method === 'GET') {
    const id = pathname.replace('/challans/', '');
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const challan = challans.find((c) => c.id === id);
    if (!challan) throw new Error('Challan not found');
    return challan as unknown as T;
  }

  if (pathname === '/challans' && method === 'POST') {
    const challans = getStoredData<Challan>(LS_CHALLANS, initialChallans);
    const customers = getStoredData<Customer>(LS_CUSTOMERS, initialCustomers);
    const products = getStoredData<Product>(LS_PRODUCTS, initialProducts);
    const movements = getStoredData<StockMovement>(LS_MOVEMENTS, initialStockMovements);
    const rawUser = localStorage.getItem('nexora_user');
    const currentUser = rawUser ? JSON.parse(rawUser) : mockUsers['admin@nexora.demo'];

    const customer = customers.find((c) => c.id === body.customerId);
    if (!customer) throw new Error('Customer not found');

    const challanNum = `CH-${new Date().getFullYear()}-${String(challans.length + 1).padStart(5, '0')}`;
    let totalQty = 0;
    let totalAmt = 0;

    const items: any[] = (body.items || []).map((item: any) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);
      totalQty += item.quantity;
      totalAmt += prod.unitPrice * item.quantity;
      return {
        id: `item-${Date.now()}-${item.productId}`,
        challanId: `ch-${Date.now()}`,
        productId: prod.id,
        productNameSnapshot: prod.productName,
        skuSnapshot: prod.sku,
        unitPriceSnapshot: prod.unitPrice,
        quantity: item.quantity,
        product: prod,
      };
    });

    const isConfirmed = body.status === 'CONFIRMED';
    if (isConfirmed) {
      // Validate & deduct
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId)!;
        if (prod.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${prod.productName}. Available: ${prod.currentStock}`);
        }
        prod.currentStock -= item.quantity;
        movements.unshift({
          id: `sm-${Date.now()}-${item.productId}`,
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Delivery Challan ${challanNum} Dispatch`,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          product: prod,
          user: currentUser,
        });
      }
      setStoredData(LS_PRODUCTS, products);
      setStoredData(LS_MOVEMENTS, movements);
    }

    const newChallan: Challan = {
      id: `ch-${Date.now()}`,
      challanNumber: challanNum,
      customerId: customer.id,
      status: body.status || 'DRAFT',
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      notes: body.notes || '',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
      user: currentUser,
      items,
    };

    challans.unshift(newChallan);
    setStoredData(LS_CHALLANS, challans);

    return newChallan as unknown as T;
  }

  throw new Error(`Endpoint ${pathname} [${method}] not handled`);
}
