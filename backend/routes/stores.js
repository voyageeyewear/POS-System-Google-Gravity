const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, isAdmin, hasStoreAccess } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', isAdmin, storeController.createStore);
router.put('/:storeId', isAdmin, storeController.updateStore);
router.delete('/:storeId', isAdmin, storeController.deleteStore);
router.post('/sync/shopify', isAdmin, storeController.syncFromShopify);

// Routes with store access check
router.get('/', storeController.getAllStores);
router.get('/:storeId', storeController.getStore);
router.get('/:storeId/inventory', hasStoreAccess, storeController.getStoreInventory);

module.exports = router;

