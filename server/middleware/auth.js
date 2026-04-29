const jwt = require('jsonwebtoken');
const { get } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.get('authorization') || req.get('Authorization');
  const normalizedHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = normalizedHeader && normalizedHeader.toLowerCase().startsWith('bearer ')
    ? normalizedHeader.slice(7).trim()
    : null;

  if (!token) {
    console.error('Authentication failed: missing bearer token', {
      method: req.method,
      path: req.originalUrl,
      hasAuthorizationHeader: Boolean(normalizedHeader),
      headerKeys: Object.keys(req.headers || {}),
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      origin: req.headers.origin || null,
    });
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar_url,
      phone: user.phone,
      department: user.department,
      status: user.status
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const normalizeRole = (role) => role === 'staff' ? 'technician' : role;

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = normalizeRole(req.user.role);
    const allowedRoles = roles.map(normalizeRole);

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user has required permission
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = normalizeRole(req.user.role);

    // Superadmin has all permissions
    if (userRole === 'superadmin') {
      return next();
    }

    // Check specific permissions based on role
    const hasPermission = checkPermission(userRole, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Simple permission checking function
const checkPermission = (role, resource, action) => {
  const permissions = {
    superadmin: {
      users: ['create', 'read', 'update', 'delete', 'manage'],
      customers: ['create', 'read', 'update', 'delete'],
      vendors: ['create', 'read', 'update', 'delete'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update', 'delete'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      budgets: ['create', 'read', 'update', 'delete'],
      delivery_notes: ['create', 'read', 'update', 'delete'],
      expenses: ['create', 'read', 'update', 'delete']
    },
    admin: {
      users: ['create', 'read', 'update', 'delete', 'manage'],
      customers: ['create', 'read', 'update', 'delete'],
      vendors: ['create', 'read', 'update', 'delete'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update', 'delete'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      budgets: ['create', 'read', 'update', 'delete'],
      delivery_notes: ['create', 'read', 'update', 'delete'],
      expenses: ['create', 'read', 'update', 'delete']
    },
    manager: {
      users: ['read'],
      customers: ['create', 'read', 'update'],
      vendors: ['create', 'read', 'update'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update'],
      budgets: ['create', 'read', 'update']
    },
    technician: {
      customers: ['read'],
      vendors: ['read'],
      projects: ['read'],
      tasks: ['create', 'read', 'update'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: ['read'],
      budgets: ['read'],
      delivery_notes: ['create', 'read', 'update']
    },
    staff: {
      customers: ['read'],
      vendors: ['read'],
      projects: ['read'],
      tasks: ['create', 'read', 'update'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: ['read'],
      budgets: ['read'],
      delivery_notes: ['create', 'read', 'update']
    },
    customer: {
      projects: ['read'],
      tasks: ['read'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: ['read']
    },
    vendor: {
      projects: ['read'],
      tasks: ['read'],
      proposals: ['read'],
      quotations: ['read']
    }
  };

  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  checkPermission
}; 