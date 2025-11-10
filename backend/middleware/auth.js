const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const { UserMethods } = require('../entities/User');

// Get User repository
const getUserRepository = () => AppDataSource.getRepository('User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepo = getUserRepository();
    
    const user = await userRepo.findOne({
      where: { id: decoded.userId },
      relations: ['assignedStore']
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Convert user to JSON with proper assignedStore serialization
    req.user = UserMethods.toJSON(user);
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
  if (!req.user.assignedStore) {
    return res.status(403).json({ error: 'No store assigned to user' });
  }
  
  const userStoreId = parseInt(req.user.assignedStore.id || req.user.assignedStore._id);
  const requestedStoreId = parseInt(storeId);
  
  if (userStoreId === requestedStoreId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied to this store' });
};
