import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NEXORA PostgreSQL database seeding...');

  // 1. Clean existing records in reverse relation order for clean idempotency
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records for fresh seed.');

  // 2. Create Role-based Users (with Ravindra Kumar as Admin)
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const salesHash = await bcrypt.hash('Sales@123', 10);
  const warehouseHash = await bcrypt.hash('Warehouse@123', 10);
  const accountsHash = await bcrypt.hash('Accounts@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Ravindra Kumar',
      email: 'admin@nexora.demo',
      passwordHash: passwordHash,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Rohan Mehta',
      email: 'sales@nexora.demo',
      passwordHash: salesHash,
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'warehouse@nexora.demo',
      passwordHash: warehouseHash,
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Pooja Iyer',
      email: 'accounts@nexora.demo',
      passwordHash: accountsHash,
      role: Role.ACCOUNTS,
    },
  });

  console.log('👤 Created 4 role-based demo users: Admin (Ravindra Kumar), Sales, Warehouse, Accounts.');

  // 3. Create 16 Realistic Indian B2B Customers
  const customerRecords = [
    {
      customerName: 'Rajesh Kulkarni',
      businessName: 'Apex Industrial Distributors Pvt Ltd',
      mobile: '+91 98201 45892',
      email: 'procurement@apexind.co.in',
      gstNumber: '27AABCA1234F1Z5',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Key distributor for Western Region. High monthly volume.',
    },
    {
      customerName: 'Sunil Agarwal',
      businessName: 'Shreeram Agro & Hardware Supplies',
      mobile: '+91 98450 11223',
      email: 'sunil@shreeramagro.com',
      gstNumber: '29ABCDE5678G2Z1',
      customerType: CustomerType.WHOLESALE,
      address: '14/B Gandhi Bazaar, Hubballi, Karnataka 580020',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'Prefers bulk delivery on first Monday of every month.',
    },
    {
      customerName: 'Ananya Deshmukh',
      businessName: 'Metro Electricals & Automation',
      mobile: '+91 97654 32109',
      email: 'ananya.d@metroautomation.in',
      gstNumber: '27AABCM9876H1Z3',
      customerType: CustomerType.WHOLESALE,
      address: '88 Shivaji Nagar, Pune, Maharashtra 411005',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'Looking for distributor pricing on heavy duty relays.',
    },
    {
      customerName: 'Vikramaditya Roy',
      businessName: 'Bengal Solar & Renewable EPC',
      mobile: '+91 93310 98765',
      email: 'vroy@bengalsolar.org',
      gstNumber: '19AAACB4321J1Z8',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Sector V, Salt Lake City, Kolkata, West Bengal 700091',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      notes: 'Quarterly supply contracts for MC4 connectors and surge protectors.',
    },
    {
      customerName: 'Karthik Ramanathan',
      businessName: 'Sri Balaji Motors & Spares',
      mobile: '+91 94440 55667',
      email: 'balajisparestn@gmail.com',
      gstNumber: '33AAAAA1234A1Z5',
      customerType: CustomerType.RETAIL,
      address: '102 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Weekly cash-and-carry retail buyer.',
    },
    {
      customerName: 'Manpreet Singh Chadha',
      businessName: 'Chadha Toolcraft & Bearings',
      mobile: '+91 98140 77889',
      email: 'info@chadhatools.co.in',
      gstNumber: '03AAACC5678K1Z2',
      customerType: CustomerType.WHOLESALE,
      address: 'GT Road, Industrial Area B, Ludhiana, Punjab 141003',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'Requested product catalog and quote for carbide drill bits.',
    },
    {
      customerName: 'Neha Singhal',
      businessName: 'Singhal Buildtech & Sanitaryware',
      mobile: '+91 98110 33445',
      email: 'neha@singhalbuildtech.com',
      gstNumber: '07AAACS9988L1Z9',
      customerType: CustomerType.RETAIL,
      address: '45 Chawri Bazar, Old Delhi, New Delhi 110006',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Inquired regarding PVC pressure valves and fittings.',
    },
    {
      customerName: 'Pradeep Chawla',
      businessName: 'Apex Machinery & Pumps Ltd',
      mobile: '+91 98250 88990',
      email: 'pchawla@apexpumps.com',
      gstNumber: '24AAACP4455M1Z1',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Plot 10, GIDC Estate, Vatva, Ahmedabad, Gujarat 382445',
      status: CustomerStatus.INACTIVE,
      followUpDate: null,
      notes: 'Account paused due to overdue payments in previous quarter.',
    },
    {
      customerName: 'Praveen Nair',
      businessName: 'Cochin Marine & Heavy Hardware',
      mobile: '+91 94470 88991',
      email: 'pnair@cochinmarine.org',
      gstNumber: '32AABCP3456J1Z9',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Harbour Road, Willingdon Island, Kochi, Kerala 682003',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Quarterly tender orders for marine-grade stainless fasteners.',
    },
    {
      customerName: 'Manish Verma',
      businessName: 'Verma Tool & Bearing House',
      mobile: '+91 98112 34567',
      email: 'manish@vermatools.net',
      gstNumber: '07AABCV1122K1Z4',
      customerType: CustomerType.RETAIL,
      address: 'Shop 12, Chawri Bazar, Old Delhi 110006',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Regular buyer of high-speed drill bits and abrasives.',
    },
    {
      customerName: 'Kavita Patel',
      businessName: 'Gujarat Packaging Solutions',
      mobile: '+91 99240 77665',
      email: 'orders@gujaratpkg.com',
      gstNumber: '24AABCG4455L1Z8',
      customerType: CustomerType.WHOLESALE,
      address: 'Phase 2, GIDC Vatva, Ahmedabad, Gujarat 382445',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Needs 500 rolls of stretch wrap per fortnight.',
    },
    {
      customerName: 'Deepak Singhania',
      businessName: 'Singhania Power Dynamics',
      mobile: '+91 98300 99887',
      email: 'deepak@singhaniapower.in',
      gstNumber: '19AABCS8899M1Z2',
      customerType: CustomerType.DISTRIBUTOR,
      address: '22 Netaji Subhas Road, Kolkata, West Bengal 700001',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'Negotiating payment terms (seeking 45 days credit).',
    },
    {
      customerName: 'Harish Reddy',
      businessName: 'Deccan Hydraulics & Pneumatics',
      mobile: '+91 98490 55443',
      email: 'hreddy@deccanfluidics.com',
      gstNumber: '36AABCD3322N1Z7',
      customerType: CustomerType.WHOLESALE,
      address: 'Plot 18, Balanagar Industrial Area, Hyderabad, Telangana 500037',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Specializes in high pressure hydraulic hose assemblies.',
    },
    {
      customerName: 'Gaurav Bhattacharya',
      businessName: 'Eastern Mining & Machinery Spares',
      mobile: '+91 94340 12345',
      email: 'gaurav@easternmining.co.in',
      gstNumber: '20AABCE4455P1Z1',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Main Road, Bistupur, Jamshedpur, Jharkhand 831001',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Long lead time buyer; large bulk values.',
    },
    {
      customerName: 'Sanjay Jain',
      businessName: 'Mahaveer Electrical Trading Co',
      mobile: '+91 94140 66778',
      email: 'mahaveerelec@yahoo.co.in',
      gstNumber: '08AABCM7788Q1Z6',
      customerType: CustomerType.RETAIL,
      address: 'M.I. Road, Jaipur, Rajasthan 302001',
      status: CustomerStatus.ACTIVE,
      followUpDate: null,
      notes: 'Walk-in cash retailer. Steady demand.',
    },
    {
      customerName: 'Alok Gupta',
      businessName: 'Kanpur Tannery & Chemical Supply',
      mobile: '+91 98390 11447',
      email: 'agupta@kanpurtannery.in',
      gstNumber: '09AABCK9900R1Z3',
      customerType: CustomerType.WHOLESALE,
      address: 'Jajmau Industrial Area, Kanpur, Uttar Pradesh 208010',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: 'Inquired about industrial pumps and corrosion-resistant valves.',
    },
  ];

  const createdCustomers = [];
  for (const c of customerRecords) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);
  }
  console.log(`🏢 Seeded ${createdCustomers.length} B2B customers.`);

  // 4. Create Customer Follow-Up Notes
  const followUpData = [
    {
      customerId: createdCustomers[0].id,
      note: 'Discussed Q3 distributor rebate scheme. Rajesh agreed to target 50 motor units.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdBy: salesUser.id,
    },
    {
      customerId: createdCustomers[1].id,
      note: 'Sunil confirmed next month bulk order dispatch schedule for stainless valves.',
      followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdBy: salesUser.id,
    },
    {
      customerId: createdCustomers[2].id,
      note: 'Ananya requested quote for 50 units of Solid State Relays (40A 240VAC). Sent via email.',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdBy: salesUser.id,
    },
    {
      customerId: createdCustomers[5].id,
      note: 'Manpreet requested updated price catalog for carbide drill bits.',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdBy: adminUser.id,
    },
    {
      customerId: createdCustomers[6].id,
      note: 'Followed up with Neha regarding pending sanitaryware tender quote.',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: salesUser.id,
    },
  ];

  for (const fu of followUpData) {
    await prisma.followUp.create({ data: fu });
  }
  console.log(`📋 Seeded ${followUpData.length} CRM follow-up interaction records.`);

  // 5. Create 12 Product Inventory Catalog Items
  const productData = [
    {
      productName: 'Heavy-Duty Industrial Motor 5HP 3-Phase',
      sku: 'MOT-IND-5HP-01',
      category: 'Motors & Actuators',
      unitPrice: 18500.0,
      currentStock: 14,
      minimumStock: 10,
      warehouseLocation: 'Bay A, Rack 01-A',
    },
    {
      productName: 'Variable Frequency Drive (VFD) 7.5kW',
      sku: 'VFD-IND-75KW',
      category: 'Electrical Automation',
      unitPrice: 24800.0,
      currentStock: 6,
      minimumStock: 8,
      warehouseLocation: 'Bay A, Rack 02-B',
    },
    {
      productName: 'Stainless Steel Ball Valve 2 Inch (SS 316)',
      sku: 'VAL-SS-BALL-2IN',
      category: 'Pipes & Valves',
      unitPrice: 3250.0,
      currentStock: 48,
      minimumStock: 25,
      warehouseLocation: 'Bay B, Rack 01-C',
    },
    {
      productName: 'High-Precision Digital Multimeter Pro',
      sku: 'TL-MM-PRO-09',
      category: 'Testing & Instruments',
      unitPrice: 4200.0,
      currentStock: 4,
      minimumStock: 15,
      warehouseLocation: 'Bay C, Shelf 04',
    },
    {
      productName: 'Solid State Relay 40A 240VAC',
      sku: 'REL-SSR-40A-240V',
      category: 'Electrical Automation',
      unitPrice: 850.0,
      currentStock: 120,
      minimumStock: 30,
      warehouseLocation: 'Bay A, Rack 03-A',
    },
    {
      productName: 'Cast Iron Submersible Pump 3HP',
      sku: 'PMP-SUB-3HP-CI',
      category: 'Pumps & Fluid Systems',
      unitPrice: 15200.0,
      currentStock: 2,
      minimumStock: 5,
      warehouseLocation: 'Bay D, Floor Area 02',
    },
    {
      productName: 'Industrial Safety Helmet with Visor (Pack of 10)',
      sku: 'PPE-HLM-VSR-10PK',
      category: 'Safety & PPE',
      unitPrice: 3500.0,
      currentStock: 35,
      minimumStock: 10,
      warehouseLocation: 'Bay C, Shelf 01',
    },
    {
      productName: 'Pneumatic Solenoid Valve 5/2 Way 24VDC',
      sku: 'PNEU-VAL-52-24V',
      category: 'Pneumatics & Hydraulics',
      unitPrice: 1950.0,
      currentStock: 0,
      minimumStock: 12,
      warehouseLocation: 'Bay B, Rack 04-D',
    },
    {
      productName: 'High-Speed Carbide End Mill 12mm 4-Flute',
      sku: 'TOOL-EM-12MM-4F',
      category: 'Cutting Tools',
      unitPrice: 1450.0,
      currentStock: 80,
      minimumStock: 20,
      warehouseLocation: 'Bay C, Drawer 03',
    },
    {
      productName: 'Programmable Logic Controller (PLC) 24 I/O',
      sku: 'PLC-MOD-24IO',
      category: 'Electrical Automation',
      unitPrice: 38500.0,
      currentStock: 5,
      minimumStock: 4,
      warehouseLocation: 'Bay A, Secure Vault 01',
    },
    {
      productName: 'Flexible Rubber Hose Pipe 50m (Heavy Pressure)',
      sku: 'HOSE-RUB-50M-HP',
      category: 'Pumps & Fluid Systems',
      unitPrice: 6800.0,
      currentStock: 18,
      minimumStock: 8,
      warehouseLocation: 'Bay D, Rack 05',
    },
    {
      productName: 'Full Body Safety Harness with Lanyard (ISI Certified)',
      sku: 'PPE-HARN-FB-ISI',
      category: 'Safety & PPE',
      unitPrice: 2200.0,
      currentStock: 45,
      minimumStock: 15,
      warehouseLocation: 'Bay C, Shelf 02',
    },
  ];

  const createdProducts = [];
  for (const p of productData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);
  }
  console.log(`📦 Seeded ${createdProducts.length} product catalog items.`);

  // 6. Create Historical Stock Movements
  const stockMovementData = [
    {
      productId: createdProducts[0].id,
      quantity: 20,
      movementType: MovementType.IN,
      reason: 'Purchase order receipt from OEM Supplier (PO-2026-440)',
      createdBy: warehouseUser.id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      productId: createdProducts[0].id,
      quantity: 6,
      movementType: MovementType.OUT,
      reason: 'Sales Challan confirmed: CH-2026-00001 dispatched to Apex Industrial Distributors',
      createdBy: adminUser.id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      productId: createdProducts[2].id,
      quantity: 50,
      movementType: MovementType.IN,
      reason: 'Batch import arrived from Pune foundry (INV-5512)',
      createdBy: warehouseUser.id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      productId: createdProducts[2].id,
      quantity: 20,
      movementType: MovementType.OUT,
      reason: 'Sales Challan confirmed: CH-2026-00002 dispatched to Shreeram Agro & Hardware Supplies',
      createdBy: salesUser.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      productId: createdProducts[4].id,
      quantity: 150,
      movementType: MovementType.IN,
      reason: 'Quarterly shipment received from Schneider OEM Hub (PO-2026-112)',
      createdBy: warehouseUser.id,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      productId: createdProducts[6].id,
      quantity: 50,
      movementType: MovementType.IN,
      reason: 'Safety equipment batch procurement (PO-2026-218)',
      createdBy: warehouseUser.id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const sm of stockMovementData) {
    await prisma.stockMovement.create({ data: sm });
  }
  console.log(`📊 Seeded ${stockMovementData.length} stock movement audit records.`);

  // 7. Create Historical Delivery Challans with Item Snapshots
  // Challan 1: Confirmed
  const ch1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-00001',
      customerId: createdCustomers[0].id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 6,
      totalAmount: 111000.0,
      notes: 'Urgent factory dispatch via V-Trans Logistics (Waybill: VT-88219)',
      createdBy: adminUser.id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productNameSnapshot: createdProducts[0].productName,
            skuSnapshot: createdProducts[0].sku,
            unitPriceSnapshot: createdProducts[0].unitPrice,
            quantity: 6,
          },
        ],
      },
    },
  });

  // Challan 2: Confirmed
  const ch2 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-00002',
      customerId: createdCustomers[1].id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 20,
      totalAmount: 65000.0,
      notes: 'Monthly bulk hardware supply. Vehicle No: KA-25-EA-9012',
      createdBy: salesUser.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: createdProducts[2].id,
            productNameSnapshot: createdProducts[2].productName,
            skuSnapshot: createdProducts[2].sku,
            unitPriceSnapshot: createdProducts[2].unitPrice,
            quantity: 20,
          },
        ],
      },
    },
  });

  // Challan 3: Draft
  const ch3 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-00003',
      customerId: createdCustomers[2].id,
      status: ChallanStatus.DRAFT,
      totalQuantity: 33,
      totalAmount: 54850.0,
      notes: 'Quotation approved. Awaiting dispatch clearance from client accounts.',
      createdBy: salesUser.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: createdProducts[4].id,
            productNameSnapshot: createdProducts[4].productName,
            skuSnapshot: createdProducts[4].sku,
            unitPriceSnapshot: createdProducts[4].unitPrice,
            quantity: 25,
          },
          {
            productId: createdProducts[3].id,
            productNameSnapshot: createdProducts[3].productName,
            skuSnapshot: createdProducts[3].sku,
            unitPriceSnapshot: createdProducts[3].unitPrice,
            quantity: 8,
          },
        ],
      },
    },
  });

  // Challan 4: Cancelled Demo
  const ch4 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-00004',
      customerId: createdCustomers[3].id,
      status: ChallanStatus.CANCELLED,
      totalQuantity: 2,
      totalAmount: 49600.0,
      notes: 'Order cancelled by client due to project site delay.',
      createdBy: salesUser.id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            productNameSnapshot: createdProducts[1].productName,
            skuSnapshot: createdProducts[1].sku,
            unitPriceSnapshot: createdProducts[1].unitPrice,
            quantity: 2,
          },
        ],
      },
    },
  });

  console.log(`📄 Seeded 4 delivery challans with item snapshot lines.`);

  console.log('🎉 NEXORA PostgreSQL database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
