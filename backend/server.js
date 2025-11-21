require('reflect-metadata');
require('dotenv').config();
const express = require('express');
const { AppDataSource } = require('./data-source');

// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const dataManagementRoutes = require('./routes/dataManagement');
const diagnosticRoutes = require('./routes/diagnostic');

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Authentication will fail.');
  console.warn('💡 Please set JWT_SECRET environment variable in Railway.');
  // Don't exit - allow server to start but log warning
}

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  WARNING: DATABASE_URL is not set. Database operations will fail.');
  console.warn('💡 Please set DATABASE_URL environment variable in Railway.');
  // Don't exit - allow server to start but log warning
}

// ========================================
// AGGRESSIVE CORS CONFIGURATION - FIRST THING!
// ========================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🌐 Incoming request:', {
    method: req.method,
    path: req.path,
    origin: origin,
    headers: req.headers
  });

  // Set CORS headers for ALL requests
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request for:', req.path);
    return res.status(200).end();
  }

  next();
});

// Track database initialization status
let dbInitialized = false;
let dbError = null;

// Initialize TypeORM in background (don't block server startup)
console.log('🔄 Starting database initialization...');
console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('📁 Current directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database connected via TypeORM');

    // Auto-seed database if no admin user exists
    const userRepo = AppDataSource.getRepository('User');
    const storeRepo = AppDataSource.getRepository('Store');
    const adminCount = await userRepo.count({ where: { role: 'admin' } });
    const storeCount = await storeRepo.count();

    if (adminCount === 0) {
      console.log('🌱 No admin user found, running auto-seed...');
      const { UserMethods } = require('./entities/User');

      // Create admin user
      const adminPassword = await UserMethods.hashPassword('admin123');
      const admin = userRepo.create({
        name: 'Admin User',
        email: 'admin@pos.com',
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      await userRepo.save(admin);
      console.log('✅ Created admin user (admin@pos.com / admin123)');
    }

    // Auto-sync stores from Shopify if none exist
    if (storeCount === 0 && process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
      console.log('🏪 No stores found, syncing from Shopify...');
      try {
        const shopifyService = require('./utils/shopify');
        const shopifyLocations = await shopifyService.getLocations();

        for (const location of shopifyLocations) {
          const address = {
            street: location.address1 || '',
            city: location.city || '',
            state: location.province || '',
            zipCode: location.zip || '',
            country: location.country || ''
          };

          const storeData = {
            name: location.name,
            location: `${location.city || 'Store'}, ${location.country || ''}`,
            address,
            phone: location.phone || '',
            email: `${location.name.toLowerCase().replace(/\s+/g, '-')}@store.com`,
            shopifyLocationId: location.id.toString(),
            isActive: location.active
          };

          const store = storeRepo.create(storeData);
          await storeRepo.save(store);
        }

        console.log(`✅ Synced ${shopifyLocations.length} stores from Shopify`);
      } catch (error) {
        console.error('❌ Failed to sync from Shopify:', error.message);
        console.log('💡 You can manually sync stores from the admin panel');
      }
    }

    dbInitialized = true;
    console.log('✅ Database initialization complete');
  })
  .catch((error) => {
    console.error('❌ Database initialization error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    dbError = error;
    console.log('⚠️  Server will continue running but database operations will fail');
    console.log('💡 Please check:');
    console.log('   1. DATABASE_URL environment variable is set correctly');
    console.log('   2. PostgreSQL database is accessible');
    console.log('   3. Database credentials are valid');
  });

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/data-management', dataManagementRoutes);
app.use('/api/diagnostic', diagnosticRoutes); // Diagnostic tools for debugging

// Health check - Must respond quickly for Railway
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check received');
  const healthStatus = {
    status: 'OK',
    message: 'POS Backend is running',
    cors: 'enabled',
    database: dbInitialized ? 'connected' : (dbError ? 'error' : 'initializing'),
    timestamp: new Date().toISOString()
  };
  
  // Always return 200 OK - Railway needs this
  res.status(200).json(healthStatus);
  console.log('✅ Health check response sent:', healthStatus.status);
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Test OPTIONS for auth login
app.options('/api/auth/login', (req, res) => {
  console.log('🔥 EXPLICIT OPTIONS handler for /api/auth/login');
  res.status(200).end();
});

// 🚀 Root route - Health check (also used by Railway)
app.get('/', (req, res) => {
  console.log('🏠 Root route accessed');
  res.status(200).json({
    message: 'POS System API',
    status: 'running',
    version: '8.0 - Progressive Loading',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      stores: '/api/stores',
      sales: '/api/sales',
      inventory: '/api/inventory',
      dataManagement: '/api/data-management',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server - bind to 0.0.0.0 for Railway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Server is ready to accept connections`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

module.exports = app;

