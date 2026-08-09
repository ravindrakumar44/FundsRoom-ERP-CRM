import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  app.listen(env.PORT, async () => {
    console.log(`🚀 NEXORA Backend API is running on http://localhost:${env.PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);

    // Verify database connection
    try {
      await prisma.$connect();
      const dbUrl = process.env.DATABASE_URL || '';
      const urlObj = new URL(dbUrl.replace('postgresql://', 'http://'));
      const host = urlObj.hostname;
      const dbName = urlObj.pathname.replace('/', '').split('?')[0];

      if (host.includes('neon.tech')) {
        console.log(`☁️  Connected to NEON CLOUD DATABASE`);
        console.log(`   Host: ${host}`);
        console.log(`   Database: ${dbName}`);
      } else {
        console.log(`💾 Connected to LOCAL PostgreSQL Database (${host}:${urlObj.port || '5432'}/${dbName})`);
      }
      console.log('✅ PostgreSQL database ready & active.');
    } catch (dbError: any) {
      console.warn('⚠️  Database Connection Warning:', dbError.message || dbError);
    }
  });
};

startServer();
