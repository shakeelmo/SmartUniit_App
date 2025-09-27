const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { sendNotification } = require('../lib/notify');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requirePermission('users', 'manage'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    // Get users with pagination
    const users = await all(
      `SELECT id, name, email, role, status, phone, department, avatar_url, created_at, updated_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const user = await get(
      'SELECT id, name, email, role, status, phone, department, avatar_url, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const { email, password, name, role = 'user', phone, department, status = 'active' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = 'user-' + Date.now();
    await run(
      `INSERT INTO users (id, email, name, password, password_hash, role, status, phone, department) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, name, hashedPassword, hashedPassword, role, status, phone, department]
    );

    // Get created user
    const user = await get(
      'SELECT id, name, email, role, status, phone, department, avatar_url, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    // Send welcome email (non-blocking)
    sendNotification({
      to: email,
      subject: 'Welcome to SmartUniit Task Flow',
      text: `Hi ${name},\n\nWelcome to SmartUniit Task Flow! Your account has been created successfully.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after your first login.`,
      html: `
        <p>Hi ${name},</p>
        <p>Welcome to <b>SmartUniit Task Flow</b>! Your account has been created successfully.</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Please change your password after your first login.</p>
      `
    }).catch((err) => console.error('Email send error:', err));

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const { name, email, role, status, phone, department, avatar_url } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailUser = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (emailUser) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    // Update user
    await run(
      `UPDATE users SET 
       name = COALESCE(?, name),
       email = COALESCE(?, email),
       role = COALESCE(?, role),
       status = COALESCE(?, status),
       phone = COALESCE(?, phone),
       department = COALESCE(?, department),
       avatar_url = COALESCE(?, avatar_url),
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, email, role, status, phone, department, avatar_url, userId]
    );

    // Get updated user
    const user = await get(
      'SELECT id, name, email, role, status, phone, department, avatar_url, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting status to inactive
    await run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inactive', userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user password
router.post('/:id/reset-password', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Check if user exists
    const existingUser = await get('SELECT id, email, name FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    // Send password reset email (non-blocking)
    sendNotification({
      to: existingUser.email,
      subject: 'Password Reset - SmartUniit Task Flow',
      text: `Hi ${existingUser.name},\n\nYour password has been reset by an administrator.\n\nYour new password: ${newPassword}\n\nPlease change your password after logging in.`,
      html: `
        <p>Hi ${existingUser.name},</p>
        <p>Your password has been reset by an administrator.</p>
        <p><strong>Your new password:</strong> ${newPassword}</p>
        <p>Please change your password after logging in.</p>
      `
    }).catch((err) => console.error('Email send error:', err));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticateToken, requirePermission('users:manage'), async (req, res) => {
  try {
    const totalUsers = await get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await get('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active']);
    const inactiveUsers = await get('SELECT COUNT(*) as count FROM users WHERE status = ?', ['inactive']);
    
    const roleStats = await all(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);

    const recentUsers = await all(`
      SELECT id, name, email, role, status, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      inactiveUsers: inactiveUsers.count,
      roleStats,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 