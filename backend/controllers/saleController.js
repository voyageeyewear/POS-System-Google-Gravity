const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Store = require('../models/Store');
const invoiceGenerator = require('../utils/invoice');

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const {
      storeId,
      items,
      customerInfo,
      paymentMethod,
      notes
    } = req.body;

    // Validate store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: customerInfo.phone });
    if (!customer) {
      customer = new Customer(customerInfo);
    } else {
      // Update customer info if provided
      customer.name = customerInfo.name || customer.name;
      customer.email = customerInfo.email || customer.email;
      customer.gstNumber = customerInfo.gstNumber || customer.gstNumber;
    }

    // Process sale items and calculate totals
    const saleItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      // Check inventory
      const storeInventory = product.inventory.find(
        inv => inv.store.toString() === storeId
      );

      if (!storeInventory || storeInventory.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient inventory for ${product.name}`
        });
      }

      // Calculate item totals
      const unitPrice = product.price;
      const discount = item.discount || 0;
      const discountedPrice = unitPrice - discount;
      const itemSubtotal = discountedPrice * item.quantity;
      const taxAmount = (itemSubtotal * product.taxRate) / 100;
      const itemTotal = itemSubtotal + taxAmount;

      saleItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        discount,
        discountedPrice,
        taxRate: product.taxRate,
        taxAmount,
        totalAmount: itemTotal
      });

      subtotal += unitPrice * item.quantity;
      totalDiscount += discount * item.quantity;
      totalTax += taxAmount;

      // Update inventory
      storeInventory.quantity -= item.quantity;
      await product.save();
    }

    const totalAmount = subtotal - totalDiscount + totalTax;

    // Create sale
    const sale = new Sale({
      store: storeId,
      cashier: req.user._id,
      customer: customer._id,
      items: saleItems,
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount,
      paymentMethod,
      notes: notes || ''
    });

    await sale.save();

    // Update customer stats
    customer.totalPurchases += totalAmount;
    customer.lastPurchaseDate = new Date();
    await customer.save();

    // Populate sale data for response
    await sale.populate(['store', 'cashier', 'customer']);

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all sales (with filters)
exports.getAllSales = async (req, res) => {
  try {
    const { storeId, startDate, endDate, cashierId } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'cashier' && req.user.assignedStore) {
      query.store = req.user.assignedStore._id;
    } else if (storeId) {
      query.store = storeId;
    }

    if (cashierId) {
      query.cashier = cashierId;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate(['store', 'cashier', 'customer'])
      .sort({ saleDate: -1 })
      .limit(100);

    res.json({ sales });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single sale
exports.getSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const sale = await Sale.findById(saleId)
      .populate(['store', 'cashier', 'customer', 'items.product']);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Check access
    if (req.user.role === 'cashier' && 
        sale.store._id.toString() !== req.user.assignedStore._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ sale });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generate invoice PDF
exports.generateInvoice = async (req, res) => {
  try {
    const { saleId } = req.params;
    const sale = await Sale.findById(saleId)
      .populate(['store', 'customer']);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Check access
    if (req.user.role === 'cashier' && 
        sale.store._id.toString() !== req.user.assignedStore._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = await invoiceGenerator.generateInvoice(
      sale,
      sale.store,
      sale.customer
    );

    res.download(filePath, `${sale.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'cashier' && req.user.assignedStore) {
      query.store = req.user.assignedStore._id;
    } else if (storeId) {
      query.store = storeId;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const stats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalTax: { $sum: '$totalTax' },
          avgSaleAmount: { $avg: '$totalAmount' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalSales: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      avgSaleAmount: 0
    };

    delete result._id;

    res.json({ stats: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

