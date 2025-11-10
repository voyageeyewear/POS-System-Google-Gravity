const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all products (cashiers can view)
router.get('/', productController.getAllProducts);
router.get('/:productId', productController.getProduct);

// Admin only routes
router.post('/', isAdmin, productController.createProduct);
router.put('/:productId', isAdmin, productController.updateProduct);
router.delete('/:productId', isAdmin, productController.deleteProduct);
router.put('/:productId/inventory', isAdmin, productController.updateInventory);
router.post('/sync/shopify', isAdmin, productController.syncFromShopify);

module.exports = router;

