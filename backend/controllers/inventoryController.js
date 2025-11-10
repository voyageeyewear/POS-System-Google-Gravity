const { AppDataSource } = require('../data-source');
const shopifyService = require('../utils/shopify');

// Get repositories
const getProductRepository = () => AppDataSource.getRepository('Product');
const getStoreRepository = () => AppDataSource.getRepository('Store');
const getInventoryRepository = () => AppDataSource.getRepository('Inventory');

// Sync inventory from Shopify
exports.syncInventoryFromShopify = async (req, res) => {
  try {
    const storeRepo = getStoreRepository();
    const productRepo = getProductRepository();
    const inventoryRepo = getInventoryRepository();

    // Get stores with Shopify location IDs
    const stores = await storeRepo
      .createQueryBuilder('store')
      .where('store.shopifyLocationId IS NOT NULL')
      .getMany();

    // Get products with Shopify variant IDs
    const products = await productRepo
      .createQueryBuilder('product')
      .where('product.shopifyVariantId IS NOT NULL')
      .getMany();

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

    // Get inventory levels from Shopify
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

      // Update inventory for each store
      for (const store of stores) {
        const locationInventory = inventoryMap.get(store.shopifyLocationId);
        
        if (locationInventory) {
          for (const [inventoryItemId, quantity] of locationInventory.entries()) {
            const product = productMap.get(inventoryItemId);
            
            if (product) {
              try {
                // Find or create inventory entry
                let inventory = await inventoryRepo.findOne({
                  where: {
                    productId: product.id,
                    storeId: store.id
                  }
                });

                if (inventory) {
                  inventory.quantity = quantity;
                } else {
                  inventory = inventoryRepo.create({
                    productId: product.id,
                    storeId: store.id,
                    quantity
                  });
                }

                await inventoryRepo.save(inventory);
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
    const productRepo = getProductRepository();
    const inventoryRepo = getInventoryRepository();
    
    // Get all active products with their inventory
    const products = await productRepo.find({
      where: { isActive: true },
      relations: ['inventory', 'inventory.store']
    });
    
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
      
      for (const inv of product.inventory || []) {
        const quantity = inv.quantity || 0;
        productTotal += quantity;
        
        const storeId = inv.store.id;
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
    console.error('Error in getInventorySummary:', error);
    res.status(400).json({ error: error.message });
  }
};
