const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['frame', 'eyeglass', 'sunglass', 'accessory'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    required: true,
    default: function() {
      // Frame & Eyeglass = 5% IGST, Sunglass = 18% IGST, Accessory = 18%
      if (this.category === 'frame' || this.category === 'eyeglass') {
        return 5;
      } else {
        return 18;
      }
    }
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  // Shopify integration fields
  shopifyProductId: {
    type: String,
    default: null
  },
  shopifyVariantId: {
    type: String,
    default: null
  },
  // Store-specific inventory
  inventory: [{
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ sku: 1 });
productSchema.index({ shopifyProductId: 1 });
productSchema.index({ 'inventory.store': 1 });

module.exports = mongoose.model('Product', productSchema);

