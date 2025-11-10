require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-system';

async function seedData() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create stores
    const stores = await Store.insertMany([
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
    ]);
    console.log(`✅ Created ${stores.length} stores`);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@pos.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Created admin user (email: admin@pos.com, password: admin123)');

    // Create cashier users for each store
    const cashiers = await User.insertMany([
      {
        name: 'John Cashier',
        email: 'john@pos.com',
        password: 'cashier123',
        role: 'cashier',
        assignedStore: stores[0]._id,
        isActive: true
      },
      {
        name: 'Sarah Cashier',
        email: 'sarah@pos.com',
        password: 'cashier123',
        role: 'cashier',
        assignedStore: stores[1]._id,
        isActive: true
      },
      {
        name: 'Mike Cashier',
        email: 'mike@pos.com',
        password: 'cashier123',
        role: 'cashier',
        assignedStore: stores[2]._id,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${cashiers.length} cashier users`);

    // Create sample products
    const products = await Product.insertMany([
      // Frames
      {
        name: 'Classic Metal Frame',
        sku: 'FRAME-001',
        category: 'frame',
        price: 2999,
        taxRate: 5,
        description: 'Premium metal frame with adjustable nose pads',
        image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 25 },
          { store: stores[1]._id, quantity: 30 },
          { store: stores[2]._id, quantity: 15 }
        ],
        isActive: true
      },
      {
        name: 'Designer Acetate Frame',
        sku: 'FRAME-002',
        category: 'frame',
        price: 3999,
        taxRate: 5,
        description: 'Luxury acetate frame with spring hinges',
        image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 20 },
          { store: stores[1]._id, quantity: 25 },
          { store: stores[2]._id, quantity: 10 }
        ],
        isActive: true
      },
      {
        name: 'Lightweight Titanium Frame',
        sku: 'FRAME-003',
        category: 'frame',
        price: 4999,
        taxRate: 5,
        description: 'Ultra-light titanium frame for all-day comfort',
        image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 15 },
          { store: stores[1]._id, quantity: 20 },
          { store: stores[2]._id, quantity: 12 }
        ],
        isActive: true
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
        inventory: [
          { store: stores[0]._id, quantity: 30 },
          { store: stores[1]._id, quantity: 35 },
          { store: stores[2]._id, quantity: 25 }
        ],
        isActive: true
      },
      {
        name: 'Wayfarer Sunglasses',
        sku: 'SUN-002',
        category: 'sunglass',
        price: 2999,
        taxRate: 18,
        description: 'Iconic wayfarer design with polarized lenses',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 28 },
          { store: stores[1]._id, quantity: 32 },
          { store: stores[2]._id, quantity: 20 }
        ],
        isActive: true
      },
      {
        name: 'Sport Sunglasses',
        sku: 'SUN-003',
        category: 'sunglass',
        price: 4499,
        taxRate: 18,
        description: 'Performance sport sunglasses with wraparound design',
        image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 18 },
          { store: stores[1]._id, quantity: 22 },
          { store: stores[2]._id, quantity: 15 }
        ],
        isActive: true
      },
      {
        name: 'Cat Eye Sunglasses',
        sku: 'SUN-004',
        category: 'sunglass',
        price: 3299,
        taxRate: 18,
        description: 'Retro cat eye style with gradient lenses',
        image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 22 },
          { store: stores[1]._id, quantity: 28 },
          { store: stores[2]._id, quantity: 16 }
        ],
        isActive: true
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
        inventory: [
          { store: stores[0]._id, quantity: 100 },
          { store: stores[1]._id, quantity: 120 },
          { store: stores[2]._id, quantity: 80 }
        ],
        isActive: true
      },
      {
        name: 'Hard Case',
        sku: 'ACC-002',
        category: 'accessory',
        price: 499,
        taxRate: 18,
        description: 'Protective hard case for eyewear',
        image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 50 },
          { store: stores[1]._id, quantity: 60 },
          { store: stores[2]._id, quantity: 40 }
        ],
        isActive: true
      },
      {
        name: 'Lens Cleaning Spray',
        sku: 'ACC-003',
        category: 'accessory',
        price: 299,
        taxRate: 18,
        description: 'Anti-fog lens cleaning solution',
        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
        inventory: [
          { store: stores[0]._id, quantity: 75 },
          { store: stores[1]._id, quantity: 90 },
          { store: stores[2]._id, quantity: 60 }
        ],
        isActive: true
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

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

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();

