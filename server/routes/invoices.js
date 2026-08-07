const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
const PAYMENT_STATUSES = new Set(['unpaid', 'partially_paid', 'paid', 'refunded']);

const normalizeInvoiceStatus = (status) => (
  INVOICE_STATUSES.has(String(status || '').toLowerCase())
    ? String(status).toLowerCase()
    : 'draft'
);

const normalizePaymentStatus = (status) => (
  PAYMENT_STATUSES.has(String(status || '').toLowerCase())
    ? String(status).toLowerCase()
    : 'unpaid'
);

// Get all invoices
router.get('/', authenticateToken, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const { search, status, customer_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (invoice_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      whereClause += ' AND customer_id = ?';
      params.push(customer_id);
    }
    
    // Get invoices with pagination
    const invoices = await all(
      `SELECT i.*, c.name as customer_name, u.name as created_by_name 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       LEFT JOIN users u ON i.created_by = u.id 
       ${whereClause} 
       ORDER BY i.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM invoices i ${whereClause}`,
      params
    );
    
    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single invoice
router.get('/:id', authenticateToken, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await get(
      `SELECT i.*, c.name as customer_name, u.name as created_by_name 
       FROM invoices i 
       LEFT JOIN customers c ON i.customer_id = c.id 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.id = ?`,
      [id]
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Get line items
    const lineItems = await all(
      'SELECT * FROM invoice_line_items WHERE invoice_id = ?',
      [id]
    );
    
    res.json({ 
      invoice: { ...invoice, lineItems }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new invoice
router.post('/', authenticateToken, requirePermission('invoices', 'create'), async (req, res) => {
  try {
    const { customer_id, project_id, quotation_id, invoice_number, amount, currency, status, payment_status, due_date, notes, lineItems } = req.body;
    
    if (!customer_id || !invoice_number || !amount) {
      return res.status(400).json({ error: 'Customer ID, invoice number, and amount are required' });
    }
    
    const invoiceId = Date.now().toString();
    
    await run(
      `INSERT INTO invoices (id, customer_id, project_id, quotation_id, invoice_number, amount, currency, status, payment_status, due_date, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, customer_id, project_id || null, quotation_id || null, invoice_number, amount, currency || 'SAR', normalizeInvoiceStatus(status), normalizePaymentStatus(payment_status), due_date, notes || '', req.user.id]
    );
    
    // Insert line items if provided
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await run(
          `INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price, total) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [Date.now().toString(), invoiceId, item.description, item.quantity, item.unitPrice, item.total]
        );
      }
    }
    
    const newInvoice = await get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, requirePermission('invoices', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_id,
      project_id,
      quotation_id,
      invoice_number,
      amount,
      currency,
      due_date,
      status,
      payment_status,
      paid_date,
      notes,
      lineItems,
    } = req.body;
    
    // Check if invoice exists
    const existingInvoice = await get(
      `SELECT id, customer_id, project_id, quotation_id, invoice_number, amount, currency,
              due_date, status, payment_status, paid_date, notes
       FROM invoices WHERE id = ?`,
      [id]
    );
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const nextStatus = status === undefined
      ? existingInvoice.status
      : normalizeInvoiceStatus(status);
    const nextPaymentStatus = payment_status === undefined
      ? existingInvoice.payment_status
      : normalizePaymentStatus(payment_status);
    
    await run(
      `UPDATE invoices 
       SET customer_id = ?, project_id = ?, quotation_id = ?, invoice_number = ?, amount = ?,
           currency = ?, due_date = ?, status = ?, payment_status = ?, paid_date = ?, notes = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        customer_id ?? existingInvoice.customer_id,
        project_id ?? existingInvoice.project_id ?? null,
        quotation_id ?? existingInvoice.quotation_id ?? null,
        invoice_number ?? existingInvoice.invoice_number,
        amount ?? existingInvoice.amount,
        currency ?? existingInvoice.currency ?? 'SAR',
        due_date ?? existingInvoice.due_date,
        nextStatus,
        nextPaymentStatus,
        paid_date ?? existingInvoice.paid_date ?? null,
        notes ?? existingInvoice.notes ?? '',
        id,
      ]
    );

    if (Array.isArray(lineItems)) {
      await run('DELETE FROM invoice_line_items WHERE invoice_id = ?', [id]);
      for (let index = 0; index < lineItems.length; index += 1) {
        const item = lineItems[index];
        await run(
          `INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`${Date.now()}-${index}`, id, item.description, item.quantity, item.unitPrice, item.total]
        );
      }
    }
    
    const updatedInvoice = await get('SELECT * FROM invoices WHERE id = ?', [id]);
    
    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, requirePermission('invoices', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if invoice exists
    const existingInvoice = await get('SELECT id FROM invoices WHERE id = ?', [id]);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Delete line items first
    await run('DELETE FROM invoice_line_items WHERE invoice_id = ?', [id]);
    
    // Delete invoice
    await run('DELETE FROM invoices WHERE id = ?', [id]);
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
