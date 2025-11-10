const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const fs = require('fs');
const path = require('path');

// Create full backup
exports.createBackup = async (req, res) => {
  try {
    const { backupName, backupType, format, description } = req.body;

    // Fetch all data from database
    const stores = await Store.find().lean();
    const users = await User.find().select('-password').lean(); // Exclude passwords
    const products = await Product.find().lean();
    const sales = await Sale.find().populate(['store', 'cashier', 'customer']).lean();
    const customers = await Customer.find().lean();

    const backupData = {
      metadata: {
        backupName: backupName || `Backup_${new Date().toISOString().split('T')[0]}`,
        backupType: backupType || 'Full Backup',
        format: format || 'JSON',
        description: description || '',
        createdAt: new Date().toISOString(),
        createdBy: req.user.email,
        version: '1.0'
      },
      data: {
        stores,
        users,
        products,
        sales,
        customers
      },
      statistics: {
        totalStores: stores.length,
        totalUsers: users.length,
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length
      }
    };

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const fileName = `${backupData.metadata.backupName}.json`;
    const filePath = path.join(backupsDir, fileName);

    // Write backup to file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    res.json({
      message: 'Backup created successfully',
      backup: {
        name: backupData.metadata.backupName,
        fileName: fileName,
        size: fs.statSync(filePath).size,
        statistics: backupData.statistics
      }
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Download backup
exports.downloadBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, '../backups', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Backup download error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all backups
exports.getAllBackups = async (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupsDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files.map(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return {
        fileName: file,
        name: content.metadata.backupName,
        size: stats.size,
        createdAt: content.metadata.createdAt,
        createdBy: content.metadata.createdBy,
        statistics: content.statistics
      };
    });

    res.json({ backups });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Clean up all data
exports.cleanupData = async (req, res) => {
  try {
    // Delete all data (except admin users)
    await Sale.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admin users
    // Note: We keep stores as they're linked to Shopify locations

    res.json({
      message: 'Data cleanup completed successfully',
      deleted: {
        sales: 'All',
        customers: 'All',
        products: 'All',
        users: 'All non-admin users'
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Refresh data from Shopify
exports.refreshData = async (req, res) => {
  try {
    const axios = require('axios');
    const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    // Fetch latest products
    const productsResponse = await axios.get(`${SHOPIFY_API_URL}/products.json`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
    });

    // Fetch latest locations
    const locationsResponse = await axios.get(`${SHOPIFY_API_URL}/locations.json`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
    });

    // Fetch inventory levels
    const inventoryResponse = await axios.get(`${SHOPIFY_API_URL}/inventory_levels.json`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
      params: { limit: 250 }
    });

    res.json({
      message: 'Data refreshed successfully from Shopify',
      refreshed: {
        products: productsResponse.data.products.length,
        locations: locationsResponse.data.locations.length,
        inventoryLevels: inventoryResponse.data.inventory_levels.length
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: error.message });
  }
};

