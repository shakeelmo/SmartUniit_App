const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all budgets
router.get('/', authenticateToken, requirePermission('budgets', 'read'), async (req, res) => {
  try {
    const { search, status, project_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (b.id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
    }
    
    if (status) {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }
    
    if (project_id) {
      whereClause += ' AND b.project_id = ?';
      params.push(project_id);
    }
    
    // Get budgets with pagination
    const budgets = await all(
      `SELECT b.*, u.name as created_by_name 
       FROM budgets b 
       LEFT JOIN users u ON b.created_by = u.id 
       ${whereClause} 
       ORDER BY b.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM budgets b ${whereClause}`,
      params
    );
    
    res.json({
      budgets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single budget
router.get('/:id', authenticateToken, requirePermission('budgets', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const budget = await get(
      `SELECT b.*, u.name as created_by_name 
       FROM budgets b 
       LEFT JOIN users u ON b.created_by = u.id 
       WHERE b.id = ?`,
      [id]
    );
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Get budget categories
    const categories = await all(
      'SELECT * FROM budget_categories WHERE budget_id = ?',
      [id]
    );
    
    res.json({ 
      budget: { ...budget, categories }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new budget
router.post('/', authenticateToken, requirePermission('budgets', 'create'), async (req, res) => {
  try {
    const { project_id, amount, categories } = req.body;
    
    if (!project_id || !amount) {
      return res.status(400).json({ error: 'Project ID and amount are required' });
    }
    
    const budgetId = Date.now().toString();
    
    await run(
      `INSERT INTO budgets (id, project_id, amount, created_by) 
       VALUES (?, ?, ?, ?)`,
      [budgetId, project_id, amount, req.user.id]
    );
    
    // Insert categories if provided
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await run(
          `INSERT INTO budget_categories (id, budget_id, name, allocated_amount, description) 
           VALUES (?, ?, ?, ?, ?)`,
          [Date.now().toString(), budgetId, category.name, category.allocatedAmount, category.description]
        );
      }
    }
    
    const newBudget = await get('SELECT * FROM budgets WHERE id = ?', [budgetId]);
    
    res.status(201).json({
      message: 'Budget created successfully',
      budget: newBudget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update budget
router.put('/:id', authenticateToken, requirePermission('budgets', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, status } = req.body;
    
    // Check if budget exists
    const existingBudget = await get('SELECT id FROM budgets WHERE id = ?', [id]);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    await run(
      `UPDATE budgets 
       SET amount = ?, currency = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [amount, currency, status, id]
    );
    
    const updatedBudget = await get('SELECT * FROM budgets WHERE id = ?', [id]);
    
    res.json({
      message: 'Budget updated successfully',
      budget: updatedBudget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete budget
router.delete('/:id', authenticateToken, requirePermission('budgets', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if budget exists
    const existingBudget = await get('SELECT id FROM budgets WHERE id = ?', [id]);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete categories first
    await run('DELETE FROM budget_categories WHERE budget_id = ?', [id]);
    
    // Delete budget
    await run('DELETE FROM budgets WHERE id = ?', [id]);
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 