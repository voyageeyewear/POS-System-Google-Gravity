const express = require('express');
const router = express.Router();
const dataManagementController = require('../controllers/dataManagementController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Most routes require admin access
router.post('/backup/create', authenticate, isAdmin, dataManagementController.createBackup);
router.get('/backup/download/:fileName', authenticate, isAdmin, dataManagementController.downloadBackup);
router.get('/backups', authenticate, isAdmin, dataManagementController.getAllBackups);
router.post('/cleanup', authenticate, isAdmin, dataManagementController.cleanupData);

// AGGRESSIVE FIX: Allow all authenticated users (including cashiers) to trigger refresh
router.post('/refresh', authenticate, dataManagementController.refreshData);

// DIAGNOSTIC: Check database status (available to all authenticated users)
router.get('/status', authenticate, dataManagementController.getDatabaseStatus);

module.exports = router;

