const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('assignedStore');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Check if user has access to specific store
exports.hasStoreAccess = (req, res, next) => {
  const storeId = req.params.storeId || req.body.storeId;
  
  // Admin has access to all stores
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Cashier can only access their assigned store
  if (req.user.assignedStore && req.user.assignedStore._id.toString() === storeId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied to this store' });
};

