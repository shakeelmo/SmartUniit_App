const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/auth');
const { sendNotification } = require('../lib/notify');

const router = express.Router();

// Get all expenses with filtering and pagination
// Superadmin-only access to all expenses endpoints
router.get('/', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category_id, 
      status, 
      start_date, 
      end_date,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // Build WHERE clause based on filters
    if (type) {
      whereConditions.push('e.type = ?');
      params.push(type);
    }
    
    if (category_id) {
      whereConditions.push('e.category_id = ?');
      params.push(category_id);
    }
    
    if (status) {
      whereConditions.push('e.status = ?');
      params.push(status);
    }
    
    if (start_date) {
      whereConditions.push('e.expense_date >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('e.expense_date <= ?');
      params.push(end_date);
    }
    
    if (search) {
      whereConditions.push('(e.title LIKE ? OR e.description LIKE ? OR e.reference_number LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM expenses e 
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
    `;
    
    const { total } = await get(countQuery, params);

    // Get expenses with category and user info
    const expensesQuery = `
      SELECT 
        e.*,
        ec.name as category_name,
        ec.type as category_type,
        u.name as user_name,
        u.email as user_email
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const expenses = await all(expensesQuery, [...params, limit, offset]);

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await get(`
      SELECT 
        e.*,
        ec.name as category_name,
        ec.type as category_type,
        u.name as user_name,
        u.email as user_email
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new expense
router.post('/', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category_id,
      type,
      payment_method,
      reference_number,
      vendor_id,
      project_id,
      expense_date,
      due_date,
      status = 'pending',
      receipt_url,
      notes
    } = req.body;

    // Validate required fields
    if (!title || !amount || !category_id || !type || !expense_date) {
      return res.status(400).json({ 
        error: 'Title, amount, category, type, and expense date are required' 
      });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be either "income" or "expense"' 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Check if category exists
    const category = await get('SELECT * FROM expense_categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const expenseId = `exp-${Date.now()}`;
    
    // Use the user ID from the authenticated request
    const userId = req.user.id;

    await run(`
      INSERT INTO expenses (
        id, title, description, amount, category_id, type, payment_method,
        reference_number, vendor_id, project_id, user_id, expense_date,
        due_date, status, receipt_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      expenseId, title, description, amount, category_id, type, payment_method,
      reference_number || null, vendor_id || null, project_id || null, userId, expense_date,
      due_date || null, status, receipt_url || null, notes || null
    ]);

    // Get created expense with details
    const expense = await get(`
      SELECT 
        e.*,
        ec.name as category_name,
        ec.type as category_type,
        u.name as user_name,
        u.email as user_email
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [expenseId]);

    // Send notification for new expense
    sendNotification({
      to: process.env.SMTP_FROM || 'admin@smartuniit.com',
      subject: `New ${type} Record Created`,
      text: `A new ${type} record has been created:\n\nTitle: ${title}\nAmount: $${amount}\nCategory: ${category.name}\nDate: ${expense_date}`,
      html: `<p>A new ${type} record has been created:</p><ul><li><b>Title:</b> ${title}</li><li><b>Amount:</b> $${amount}</li><li><b>Category:</b> ${category.name}</li><li><b>Date:</b> ${expense_date}</li></ul>`
    }).catch((err) => console.error('Notification send error:', err));

    res.status(201).json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense
router.put('/:id', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      amount,
      category_id,
      type,
      payment_method,
      reference_number,
      vendor_id,
      project_id,
      expense_date,
      due_date,
      status,
      receipt_url,
      notes
    } = req.body;

    // Check if expense exists
    const existingExpense = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be either "income" or "expense"' 
      });
    }

    // Validate amount if provided
    if (amount && amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Check if category exists if provided
    if (category_id) {
      const category = await get('SELECT * FROM expense_categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    await run(`
      UPDATE expenses SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        amount = COALESCE(?, amount),
        category_id = COALESCE(?, category_id),
        type = COALESCE(?, type),
        payment_method = COALESCE(?, payment_method),
        reference_number = COALESCE(?, reference_number),
        vendor_id = COALESCE(?, vendor_id),
        project_id = COALESCE(?, project_id),
        expense_date = COALESCE(?, expense_date),
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status),
        receipt_url = COALESCE(?, receipt_url),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, description, amount, category_id, type, payment_method,
      reference_number || null, vendor_id || null, project_id || null, expense_date, due_date || null,
      status, receipt_url || null, notes || null, id
    ]);

    // Get updated expense
    const expense = await get(`
      SELECT 
        e.*,
        ec.name as category_name,
        ec.type as category_type,
        u.name as user_name,
        u.email as user_email
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [id]);

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await run('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expense categories
router.get('/categories/all', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { type } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (type) {
      whereClause = 'WHERE type = ?';
      params.push(type);
    }

    const categories = await all(`
      SELECT * FROM expense_categories 
      ${whereClause}
      ORDER BY type, name
    `, params);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cash flow summary
router.get('/reports/cash-flow', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = ' AND expense_date BETWEEN ? AND ?';
      params = [start_date, end_date];
    }

    // Get income summary
    const incomeSummary = await get(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses 
      WHERE type = 'income'${dateFilter}
    `, params);

    // Get expense summary
    const expenseSummary = await get(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses 
      WHERE type = 'expense'${dateFilter}
    `, params);

    // Get category breakdown
    let categoryBreakdown;
    if (dateFilter) {
      categoryBreakdown = await all(`
        SELECT 
          ec.name as category_name,
          ec.type as category_type,
          COUNT(e.id) as count,
          COALESCE(SUM(e.amount), 0) as total_amount
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id AND e.expense_date BETWEEN ? AND ?
        GROUP BY ec.id, ec.name, ec.type
        ORDER BY total_amount DESC
      `, params);
    } else {
      categoryBreakdown = await all(`
        SELECT 
          ec.name as category_name,
          ec.type as category_type,
          COUNT(e.id) as count,
          COALESCE(SUM(e.amount), 0) as total_amount
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id
        GROUP BY ec.id, ec.name, ec.type
        ORDER BY total_amount DESC
      `);
    }

    const netCashFlow = incomeSummary.total_amount - expenseSummary.total_amount;

    res.json({
      summary: {
        total_income: incomeSummary.total_amount,
        total_expenses: expenseSummary.total_amount,
        net_cash_flow: netCashFlow,
        income_count: incomeSummary.count,
        expense_count: expenseSummary.count
      },
      category_breakdown: categoryBreakdown
    });
  } catch (error) {
    console.error('Get cash flow summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export expenses to Excel
router.get('/export/excel', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { start_date, end_date, type, category_id } = req.query;
    
    let whereConditions = [];
    let params = [];

    if (start_date && end_date) {
      whereConditions.push('e.expense_date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    if (type) {
      whereConditions.push('e.type = ?');
      params.push(type);
    }
    
    if (category_id) {
      whereConditions.push('e.category_id = ?');
      params.push(category_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const expenses = await all(`
      SELECT 
        e.title,
        e.description,
        e.amount,
        e.type,
        ec.name as category_name,
        e.payment_method,
        e.reference_number,
        e.expense_date,
        e.status,
        e.notes,
        u.name as user_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.expense_date DESC
    `, params);

    // For now, return JSON. In production, you'd generate actual Excel file
    res.json({
      message: 'Export data ready',
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
