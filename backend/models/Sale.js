const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountedPrice: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true // Allow null/undefined temporarily before pre-save hook
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'other'],
    required: true
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-generate store-specific invoice number
saleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      // Get store details
      const Store = mongoose.model('Store');
      const store = await Store.findById(this.store);
      
      if (!store) {
        throw new Error('Store not found for invoice generation');
      }

      // Generate store prefix from store name
      // Delhi -> DELHVOYA, Udaipur -> UDAIVOYA, etc.
      let storePrefix = store.name.toUpperCase().substring(0, 4);
      
      // Add VOYA suffix
      storePrefix = `${storePrefix}VOYA`;

      // Count existing invoices for this store to maintain sequence
      const Sale = mongoose.model('Sale');
      const storeInvoiceCount = await Sale.countDocuments({ 
        store: this.store,
        invoiceNumber: { $exists: true, $ne: null }
      });

      // Generate invoice number: DELHVOYA0001, DELHVOYA0002, etc.
      const sequenceNumber = (storeInvoiceCount + 1).toString().padStart(4, '0');
      this.invoiceNumber = `${storePrefix}${sequenceNumber}`;

      console.log(`📄 Generated invoice number: ${this.invoiceNumber} for store: ${store.name}`);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return next(error);
    }
  }
  next();
});

// Indexes for faster queries
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ store: 1, saleDate: -1 });
saleSchema.index({ cashier: 1 });
saleSchema.index({ saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);

