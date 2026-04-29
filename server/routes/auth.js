const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../lib/notify');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar_url || null,
  phone: user.phone || null,
  department: user.department || null,
  status: user.status,
  createdAt: user.created_at,
  updatedAt: user.updated_at
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company, phone } = req.body;

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

    // Create user - fixed column names to match database schema
    const userId = Date.now().toString();
    await run(
      `INSERT INTO users (id, email, name, role, password_hash, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email, name, 'admin', hashedPassword, 'active']
    );

    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    // Get created user
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);

    // Send welcome email (non-blocking)
    sendNotification({
      to: email,
      subject: 'Welcome to SmartUniit Task Flow',
      text: `Hi ${name},\n\nWelcome to SmartUniit Task Flow! Your account has been created successfully.`,
      html: `<p>Hi ${name},</p><p>Welcome to <b>SmartUniit Task Flow</b>! Your account has been created successfully.</p>`
    }).catch((err) => console.error('Email send error:', err));

    // Notify admin (non-blocking)
    sendNotification({
      to: process.env.SMTP_FROM || 'info@smartuniit.com',
      subject: 'New User Registration',
      text: `A new user has registered.\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || ''}\nPhone: ${phone || ''}`,
      html: `<p>A new user has registered:</p><ul><li><b>Name:</b> ${name}</li><li><b>Email:</b> ${email}</li><li><b>Company:</b> ${company || ''}</li><li><b>Phone:</b> ${phone || ''}</li></ul>`
    }).catch((err) => console.error('Admin email send error:', err));

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: mapUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (support legacy column `password` if present)
    const passwordField = user.password_hash || user.password;
    if (!passwordField) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(password, passwordField);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: mapUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: mapUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    // Update user
    await run(
      `UPDATE users SET name = COALESCE(?, name), updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, req.user.id]
    );

    // Get updated user
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Profile updated successfully',
      user: mapUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user with password
    const user = await get('SELECT password, password_hash FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const passwordField = user.password_hash || user.password;
    if (!passwordField) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, passwordField);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Create user with custom credentials
router.post('/create-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { get, run } = require('../db');
    
    const { email, password, name, role = 'user' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Check if user already exists
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      return res.json({ message: 'User already exists', user: existingUser });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user-' + Date.now();
    
    await run(
      `INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, role, 'active']
    );
    
    res.json({ 
      message: 'User created successfully',
      user: {
        id: userId,
        email: email,
        name: name,
        role: role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 