const Store = require('../models/Store');
const Product = require('../models/Product');
const shopifyService = require('../utils/shopify');

// Create new store
exports.createStore = async (req, res) => {
  try {
    const store = new Store(req.body);
    await store.save();
    
    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json({ stores });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single store
exports.getStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update store
exports.updateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findByIdAndUpdate(
      storeId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ message: 'Store updated successfully', store });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete store
exports.deleteStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findByIdAndDelete(storeId);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get store inventory
exports.getStoreInventory = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const products = await Product.find({
      'inventory.store': storeId,
      isActive: true
    });

    // Filter inventory to show only the requested store AND only products with quantity > 0
    const inventoryData = products
      .map(product => {
        const storeInventory = product.inventory.find(
          inv => inv.store.toString() === storeId
        );
        
        return {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          taxRate: product.taxRate,
          description: product.description,
          image: product.image,
          quantity: storeInventory ? storeInventory.quantity : 0
        };
      })
      .filter(item => item.quantity > 0); // Only return products with stock available

    console.log(`📦 Store ${storeId}: Returning ${inventoryData.length} products with available stock`);

    res.json({ inventory: inventoryData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Sync stores from Shopify locations
exports.syncFromShopify = async (req, res) => {
  try {
    const shopifyLocations = await shopifyService.getLocations();
    const syncResults = { created: 0, updated: 0, errors: [] };

    for (const location of shopifyLocations) {
      try {
        // Parse address
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
          shopifyLocationId: location.id.toString(),
          isActive: location.active
        };

        // Check if store exists
        const existingStore = await Store.findOne({
          shopifyLocationId: location.id.toString()
        });

        if (existingStore) {
          await Store.findByIdAndUpdate(existingStore._id, storeData);
          syncResults.updated++;
        } else {
          await Store.create(storeData);
          syncResults.created++;
        }
      } catch (error) {
        syncResults.errors.push({
          location: location.name,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Shopify locations sync completed',
      results: syncResults
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

