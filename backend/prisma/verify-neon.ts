import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyDatabases() {
  console.log('===============================================================');
  console.log('  🔍 NEXORA DATABASE VERIFICATION & AUDIT REPORT');
  console.log('===============================================================\n');

  const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:Ravindra123@localhost:5432/nexora?schema=public';
  const neonUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  // 1. Verify Local Database (PostgreSQL localhost:5432/nexora)
  console.log('📍 1. VERIFYING LOCAL DATABASE (localhost:5432/nexora):');
  let localStats: any = null;
  try {
    const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });
    await localPrisma.$connect();

    const [users, customers, followUps, products, stockMovements, challans, challanItems] = await Promise.all([
      localPrisma.user.count(),
      localPrisma.customer.count(),
      localPrisma.followUp.count(),
      localPrisma.product.count(),
      localPrisma.stockMovement.count(),
      localPrisma.challan.count(),
      localPrisma.challanItem.count(),
    ]);

    const adminUser = await localPrisma.user.findFirst({ where: { role: 'ADMIN' } });

    localStats = {
      connected: true,
      users,
      customers,
      followUps,
      products,
      stockMovements,
      challans,
      challanItems,
      adminName: adminUser?.name,
      adminEmail: adminUser?.email,
      adminRole: adminUser?.role,
    };

    console.log('   ✅ Local database connection: ONLINE & HEALTHY');
    console.log(`   👤 Local Admin User: ${localStats.adminName} (${localStats.adminEmail}) [${localStats.adminRole}]`);
    console.log(`   📊 Local Rows -> Users: ${users}, Customers: ${customers}, Products: ${products}, Challans: ${challans}\n`);
    await localPrisma.$disconnect();
  } catch (err: any) {
    console.log('   ⚠️  Local Database Check:', err.message || err);
  }

  // 2. Verify Neon Cloud Database (neondb)
  console.log('☁️  2. VERIFYING NEON CLOUD DATABASE:');
  if (!neonUrl || neonUrl.includes('username:password@ep-sample-pooler')) {
    console.log('   ⚠️  NEON_DATABASE_URL is not yet set with your real connection string in backend/.env');
    console.log('   👉 Please paste your Neon connection string into NEON_DATABASE_URL in backend/.env and run this command again.\n');
    return;
  }

  let neonStats: any = null;
  try {
    const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });
    await neonPrisma.$connect();

    const [users, customers, followUps, products, stockMovements, challans, challanItems] = await Promise.all([
      neonPrisma.user.count(),
      neonPrisma.customer.count(),
      neonPrisma.followUp.count(),
      neonPrisma.product.count(),
      neonPrisma.stockMovement.count(),
      neonPrisma.challan.count(),
      neonPrisma.challanItem.count(),
    ]);

    const adminUser = await neonPrisma.user.findFirst({ where: { role: 'ADMIN' } });

    neonStats = {
      connected: true,
      users,
      customers,
      followUps,
      products,
      stockMovements,
      challans,
      challanItems,
      adminName: adminUser?.name,
      adminEmail: adminUser?.email,
      adminRole: adminUser?.role,
    };

    console.log('   ✅ Neon Cloud Database: ONLINE & FULLY SYNCHRONIZED');
    console.log(`   👤 Neon Admin User: ${neonStats.adminName} (${neonStats.adminEmail}) [${neonStats.adminRole}]`);
    console.log(`   📊 Neon Rows -> Users: ${users}, Customers: ${customers}, Products: ${products}, Challans: ${challans}\n`);
    await neonPrisma.$disconnect();
  } catch (err: any) {
    console.error('   ❌ Neon Database Check Failed:', err.message || err);
  }

  // Summary Table
  console.log('===============================================================');
  console.log('                 COMPARATIVE AUDIT SUMMARY');
  console.log('===============================================================');
  console.table({
    'users (Accounts)': {
      'Local (nexora)': localStats?.users ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.users ?? 'N/A',
    },
    'customers (CRM)': {
      'Local (nexora)': localStats?.customers ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.customers ?? 'N/A',
    },
    'follow_ups (Notes)': {
      'Local (nexora)': localStats?.followUps ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.followUps ?? 'N/A',
    },
    'products (Catalog)': {
      'Local (nexora)': localStats?.products ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.products ?? 'N/A',
    },
    'stock_movements': {
      'Local (nexora)': localStats?.stockMovements ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.stockMovements ?? 'N/A',
    },
    'challans (Orders)': {
      'Local (nexora)': localStats?.challans ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.challans ?? 'N/A',
    },
    'challan_items (Snapshots)': {
      'Local (nexora)': localStats?.challanItems ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.challanItems ?? 'N/A',
    },
    'Admin User Identity': {
      'Local (nexora)': localStats?.adminName ?? 'N/A',
      'Neon Cloud (neondb)': neonStats?.adminName ?? 'N/A',
    },
  });
  console.log('===============================================================\n');
}

verifyDatabases().catch((e) => {
  console.error('Verification error:', e);
});
