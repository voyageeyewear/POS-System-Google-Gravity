const Product = require('../models/Product');
const Store = require('../models/Store');
const shopifyService = require('../utils/shopify');

// Sync inventory from Shopify
exports.syncInventoryFromShopify = async (req, res) => {
  try {
    const stores = await Store.find({ shopifyLocationId: { $ne: null } });
    const products = await Product.find({ shopifyVariantId: { $ne: null } });

    if (stores.length === 0) {
      return res.status(400).json({ 
        error: 'No Shopify stores found. Please sync stores first.' 
      });
    }

    if (products.length === 0) {
      return res.status(400).json({ 
        error: 'No Shopify products found. Please sync products first.' 
      });
    }

    const syncResults = {
      totalProducts: products.length,
      totalStores: stores.length,
      updated: 0,
      errors: []
    };

    // Get all inventory item IDs
    const inventoryItemIds = [];
    const productMap = new Map();

    for (const product of products) {
      if (product.shopifyVariantId) {
        try {
          const shopifyProduct = await shopifyService.getProduct(product.shopifyProductId);
          const variant = shopifyProduct.variants.find(v => v.id.toString() === product.shopifyVariantId);
          
          if (variant && variant.inventory_item_id) {
            inventoryItemIds.push(variant.inventory_item_id);
            productMap.set(variant.inventory_item_id, product);
          }
        } catch (error) {
          console.error(`Error fetching product ${product.name}:`, error.message);
        }
      }
    }

    // Get inventory levels from Shopify (batch request)
    if (inventoryItemIds.length > 0) {
      const inventoryLevels = await shopifyService.getInventoryLevels(inventoryItemIds);

      // Create a map of location -> item -> quantity
      const inventoryMap = new Map();
      
      for (const level of inventoryLevels) {
        const locationId = level.location_id.toString();
        if (!inventoryMap.has(locationId)) {
          inventoryMap.set(locationId, new Map());
        }
        inventoryMap.get(locationId).set(level.inventory_item_id, level.available || 0);
      }

      // Update products with inventory for each store
      for (const store of stores) {
        const locationInventory = inventoryMap.get(store.shopifyLocationId);
        
        if (locationInventory) {
          for (const [inventoryItemId, quantity] of locationInventory.entries()) {
            const product = productMap.get(inventoryItemId);
            
            if (product) {
              try {
                // Find if inventory entry exists for this store
                const inventoryIndex = product.inventory.findIndex(
                  inv => inv.store.toString() === store._id.toString()
                );

                if (inventoryIndex > -1) {
                  product.inventory[inventoryIndex].quantity = quantity;
                } else {
                  product.inventory.push({ store: store._id, quantity });
                }

                await product.save();
                syncResults.updated++;
              } catch (error) {
                syncResults.errors.push({
                  product: product.name,
                  store: store.name,
                  error: error.message
                });
              }
            }
          }
        }
      }
    }

    res.json({
      message: 'Inventory sync completed',
      results: syncResults
    });
  } catch (error) {
    console.error('Inventory sync error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('inventory.store');
    
    const summary = {
      totalProducts: products.length,
      totalInventory: 0,
      byStore: [],
      lowStock: []
    };

    // Calculate totals
    const storeMap = new Map();
    
    for (const product of products) {
      let productTotal = 0;
      
      for (const inv of product.inventory) {
        const quantity = inv.quantity || 0;
        productTotal += quantity;
        
        const storeId = inv.store._id.toString();
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            store: inv.store.name,
            quantity: 0
          });
        }
        storeMap.get(storeId).quantity += quantity;
      }
      
      summary.totalInventory += productTotal;
      
      // Track low stock items (less than 5 units total)
      if (productTotal < 5 && productTotal > 0) {
        summary.lowStock.push({
          name: product.name,
          sku: product.sku,
          quantity: productTotal
        });
      }
    }

    summary.byStore = Array.from(storeMap.values());

    res.json({ summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

