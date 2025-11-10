const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const { UserMethods } = require('../entities/User');

// Get User repository
const getUserRepository = () => AppDataSource.getRepository('User');
const getStoreRepository = () => AppDataSource.getRepository('Store');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user (Admin only)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, assignedStore } = req.body;
    const userRepo = getUserRepository();

    // Check if user already exists
    const existingUser = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await UserMethods.hashPassword(password);

    const user = userRepo.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'cashier',
      assignedStoreId: assignedStore || null
    });

    await userRepo.save(user);
    
    // Return user without password
    const userResponse = UserMethods.toJSON(user);
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRepo = getUserRepository();

    // Find user with password field
    const user = await userRepo.findOne({
      where: { email: email.toLowerCase() },
      relations: ['assignedStore'],
      select: ['id', 'name', 'email', 'password', 'role', 'assignedStoreId', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Check password
    const isMatch = await UserMethods.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const userResponse = UserMethods.toJSON(user);

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const userRepo = getUserRepository();

    // Don't allow password update through this endpoint
    delete updates.password;

    const user = await userRepo.findOne({
      where: { id: parseInt(userId) },
      relations: ['assignedStore']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    Object.assign(user, updates);
    await userRepo.save(user);

    const userResponse = UserMethods.toJSON(user);

    res.json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const userRepo = getUserRepository();
    const users = await userRepo.find({
      relations: ['assignedStore'],
      order: { createdAt: 'DESC' }
    });

    const usersResponse = users.map(user => UserMethods.toJSON(user));
    
    res.json({ users: usersResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRepo = getUserRepository();
    
    const user = await userRepo.findOne({ where: { id: parseInt(userId) } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRepo.remove(user);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
