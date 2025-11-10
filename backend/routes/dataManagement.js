const express = require('express');
const router = express.Router();
const dataManagementController = require('../controllers/dataManagementController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require admin access
router.post('/backup/create', authenticate, isAdmin, dataManagementController.createBackup);
router.get('/backup/download/:fileName', authenticate, isAdmin, dataManagementController.downloadBackup);
router.get('/backups', authenticate, isAdmin, dataManagementController.getAllBackups);
router.post('/cleanup', authenticate, isAdmin, dataManagementController.cleanupData);
router.post('/refresh', authenticate, isAdmin, dataManagementController.refreshData);

module.exports = router;

