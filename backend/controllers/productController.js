const Product = require('../models/Product');
const shopifyService = require('../utils/shopify');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Get paginated products
    const products = await Product.find(query)
      .populate('inventory.store')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({ 
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('inventory.store');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    ).populate('inventory.store');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product inventory for a store
exports.updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find if inventory entry exists for this store
    const inventoryIndex = product.inventory.findIndex(
      inv => inv.store.toString() === storeId
    );

    if (inventoryIndex > -1) {
      product.inventory[inventoryIndex].quantity = quantity;
    } else {
      product.inventory.push({ store: storeId, quantity });
    }

    await product.save();

    res.json({ message: 'Inventory updated successfully', product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Sync products from Shopify
exports.syncFromShopify = async (req, res) => {
  try {
    console.log('🔄 Starting Shopify product sync...');
    const shopifyProducts = await shopifyService.getProducts();
    const syncResults = { created: 0, updated: 0, errors: [] };

    console.log(`📦 Processing ${shopifyProducts.length} products from Shopify...`);

    for (const shopifyProduct of shopifyProducts) {
      try {
        // For simplicity, we'll use the first variant
        const variant = shopifyProduct.variants[0];
        
        // Determine category based on product type or tags
        let category = 'accessory';
        let taxRate = 18; // Default for accessories and sunglasses
        
        const productType = shopifyProduct.product_type?.toLowerCase() || '';
        const tags = shopifyProduct.tags?.toLowerCase() || '';
        const title = shopifyProduct.title?.toLowerCase() || '';
        
        if (productType.includes('frame') || tags.includes('frame') || title.includes('frame')) {
          category = 'frame';
          taxRate = 5;
        } else if (productType.includes('eyeglass') || tags.includes('eyeglass') || title.includes('eyeglass')) {
          category = 'eyeglass';
          taxRate = 5;
        } else if (productType.includes('sunglass') || tags.includes('sunglass') || title.includes('sunglass')) {
          category = 'sunglass';
          taxRate = 18;
        }

        const productData = {
          name: shopifyProduct.title,
          sku: variant.sku || `SHOPIFY-${variant.id}`,
          category,
          price: parseFloat(variant.price),
          taxRate, // Explicitly set tax rate
          description: shopifyProduct.body_html || '',
          image: shopifyProduct.image?.src || '',
          shopifyProductId: shopifyProduct.id.toString(),
          shopifyVariantId: variant.id.toString()
        };

        // Check if product exists
        const existingProduct = await Product.findOne({
          shopifyProductId: shopifyProduct.id.toString()
        });

        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          syncResults.updated++;
          console.log(`✏️ Updated: ${productData.name}`);
        } else {
          await Product.create(productData);
          syncResults.created++;
          console.log(`✨ Created: ${productData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${shopifyProduct.title}:`, error.message);
        syncResults.errors.push({
          product: shopifyProduct.title,
          error: error.message
        });
      }
    }

    console.log('✅ Sync completed:', syncResults);

    res.json({
      message: 'Shopify sync completed',
      results: syncResults
    });
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    res.status(400).json({ error: error.message });
  }
};

