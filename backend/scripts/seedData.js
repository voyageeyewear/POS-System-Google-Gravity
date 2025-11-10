require('reflect-metadata');
require('dotenv').config({ path: '../.env' });
const { AppDataSource } = require('../data-source');
const { UserMethods } = require('../entities/User');

async function seedData() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Initialize TypeORM connection
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');

    // Get repositories
    const userRepo = AppDataSource.getRepository('User');
    const storeRepo = AppDataSource.getRepository('Store');
    const productRepo = AppDataSource.getRepository('Product');
    const inventoryRepo = AppDataSource.getRepository('Inventory');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await inventoryRepo.delete({});
    await productRepo.delete({});
    await userRepo.delete({});
    await storeRepo.delete({});
    console.log('✅ Cleared existing data');

    // Create stores
    const storeData = [
      {
        name: 'Downtown Store',
        location: 'Downtown',
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        phone: '+1-555-0101',
        email: 'downtown@eyewear.com',
        isActive: true
      },
      {
        name: 'Mall Store',
        location: 'Shopping Mall',
        address: {
          street: '456 Mall Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        phone: '+1-555-0102',
        email: 'mall@eyewear.com',
        isActive: true
      },
      {
        name: 'Airport Store',
        location: 'International Airport',
        address: {
          street: '789 Airport Road',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        phone: '+1-555-0103',
        email: 'airport@eyewear.com',
        isActive: true
      }
    ];

    const stores = [];
    for (const data of storeData) {
      const store = storeRepo.create(data);
      await storeRepo.save(store);
      stores.push(store);
    }
    console.log(`✅ Created ${stores.length} stores`);

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
    console.log('✅ Created admin user (email: admin@pos.com, password: admin123)');

    // Create cashier users for each store
    const cashierData = [
      { name: 'John Cashier', email: 'john@pos.com', storeId: stores[0].id },
      { name: 'Sarah Cashier', email: 'sarah@pos.com', storeId: stores[1].id },
      { name: 'Mike Cashier', email: 'mike@pos.com', storeId: stores[2].id }
    ];

    const cashierPassword = await UserMethods.hashPassword('cashier123');
    const cashiers = [];
    for (const data of cashierData) {
      const cashier = userRepo.create({
        name: data.name,
        email: data.email,
        password: cashierPassword,
        role: 'cashier',
        assignedStoreId: data.storeId,
        isActive: true
      });
      await userRepo.save(cashier);
      cashiers.push(cashier);
    }
    console.log(`✅ Created ${cashiers.length} cashier users`);

    // Create sample products
    const productData = [
      // Frames
      {
        name: 'Classic Metal Frame',
        sku: 'FRAME-001',
        category: 'frame',
        price: 2999,
        taxRate: 5,
        description: 'Premium metal frame with adjustable nose pads',
        image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 25 },
          { storeId: stores[1].id, quantity: 30 },
          { storeId: stores[2].id, quantity: 15 }
        ]
      },
      {
        name: 'Designer Acetate Frame',
        sku: 'FRAME-002',
        category: 'frame',
        price: 3999,
        taxRate: 5,
        description: 'Luxury acetate frame with spring hinges',
        image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 20 },
          { storeId: stores[1].id, quantity: 25 },
          { storeId: stores[2].id, quantity: 10 }
        ]
      },
      {
        name: 'Lightweight Titanium Frame',
        sku: 'FRAME-003',
        category: 'frame',
        price: 4999,
        taxRate: 5,
        description: 'Ultra-light titanium frame for all-day comfort',
        image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 15 },
          { storeId: stores[1].id, quantity: 20 },
          { storeId: stores[2].id, quantity: 12 }
        ]
      },
      // Sunglasses
      {
        name: 'Aviator Sunglasses',
        sku: 'SUN-001',
        category: 'sunglass',
        price: 3499,
        taxRate: 18,
        description: 'Classic aviator style with UV protection',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 30 },
          { storeId: stores[1].id, quantity: 35 },
          { storeId: stores[2].id, quantity: 25 }
        ]
      },
      {
        name: 'Wayfarer Sunglasses',
        sku: 'SUN-002',
        category: 'sunglass',
        price: 2999,
        taxRate: 18,
        description: 'Iconic wayfarer design with polarized lenses',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 28 },
          { storeId: stores[1].id, quantity: 32 },
          { storeId: stores[2].id, quantity: 20 }
        ]
      },
      // Accessories
      {
        name: 'Microfiber Cleaning Cloth',
        sku: 'ACC-001',
        category: 'accessory',
        price: 199,
        taxRate: 18,
        description: 'Premium microfiber cloth for lens cleaning',
        image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 100 },
          { storeId: stores[1].id, quantity: 120 },
          { storeId: stores[2].id, quantity: 80 }
        ]
      },
      {
        name: 'Hard Case',
        sku: 'ACC-002',
        category: 'accessory',
        price: 499,
        taxRate: 18,
        description: 'Protective hard case for eyewear',
        image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400',
        inventoryData: [
          { storeId: stores[0].id, quantity: 50 },
          { storeId: stores[1].id, quantity: 60 },
          { storeId: stores[2].id, quantity: 40 }
        ]
      }
    ];

    let productCount = 0;
    for (const data of productData) {
      const { inventoryData, ...productFields } = data;
      
      // Create product
      const product = productRepo.create(productFields);
      await productRepo.save(product);
      
      // Create inventory entries
      for (const inv of inventoryData) {
        const inventory = inventoryRepo.create({
          productId: product.id,
          storeId: inv.storeId,
          quantity: inv.quantity
        });
        await inventoryRepo.save(inventory);
      }
      
      productCount++;
    }
    console.log(`✅ Created ${productCount} products with inventory`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@pos.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Cashiers:');
    console.log('  Email: john@pos.com (Downtown Store)');
    console.log('  Email: sarah@pos.com (Mall Store)');
    console.log('  Email: mike@pos.com (Airport Store)');
    console.log('  Password: cashier123');
    console.log('─────────────────────────────────────\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
