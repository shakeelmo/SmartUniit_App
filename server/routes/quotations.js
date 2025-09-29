const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { run, all, get } = require('../db');

// Generate quote number
const generateQuoteNumber = async () => {
  const result = await get('SELECT COUNT(*) as count FROM quotations');
  const count = result.count + 1;
  const year = new Date().getFullYear();
  return `Q-${year}-${count.toString().padStart(4, '0')}`;
};

// Get all quotations
router.get('/', authenticateToken, requirePermission('quotations', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      whereClause += ' AND q.customer_id = ?';
      params.push(customer_id);
    }
    
    const quotations = await all(`
      SELECT q.*, u.name as created_by_name, c.name as customer_name
      FROM quotations q 
      LEFT JOIN users u ON q.created_by = u.id 
      LEFT JOIN customers c ON q.customer_id = c.id
      ${whereClause}
      ORDER BY q.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get line items for each quotation
    for (let quotation of quotations) {
      const lineItems = await all(
        'SELECT * FROM quotation_line_items WHERE quotation_id = ? ORDER BY created_at ASC',
        [quotation.id]
      );
      quotation.lineItems = lineItems;
    }
    
    const totalResult = await get(`
      SELECT COUNT(*) as total FROM quotations q ${whereClause}
    `, params);
    
    res.json({
      quotations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single quotation
router.get('/:id', authenticateToken, requirePermission('quotations', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await get(`
      SELECT q.*, u.name as created_by_name, c.name as customer_name
      FROM quotations q 
      LEFT JOIN users u ON q.created_by = u.id 
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ?
    `, [id]);
    
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    
    const lineItems = await all(
      'SELECT * FROM quotation_line_items WHERE quotation_id = ? ORDER BY created_at ASC',
      [id]
    );
    
    quotation.lineItems = lineItems;
    
    res.json({ quotation });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quotation
router.post('/', authenticateToken, requirePermission('quotations', 'create'), async (req, res) => {
  try {
    const { 
      amount, 
      total_amount, 
      currency, 
      valid_until, 
      terms, 
      scopeOfWork,
      scopeOfWorkAr,
      lineItems, 
      customer_id,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatRate,
      vatAmount,
      total
    } = req.body;
    
    const finalAmount = amount || total_amount || total;
    
    if (!finalAmount || isNaN(finalAmount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    const numericAmount = parseFloat(finalAmount);
    
    const quotationId = Date.now().toString();
    const quoteNumber = await generateQuoteNumber();
    
    // Detect legacy columns for backward compatibility on existing VPS DBs
    const columnsInfo = await all('PRAGMA table_info(quotations)');
    const columnNames = new Set(columnsInfo.map(c => c.name));

    // Some deployments have NOT NULL customer_name and an items JSON column
    const includeCustomerName = columnNames.has('customer_name');
    const includeItems = columnNames.has('items');

    // Resolve customer name when customer_id provided
    let legacyCustomerName = null;
    if (includeCustomerName && customer_id) {
      const customerRow = await get('SELECT name FROM customers WHERE id = ?', [customer_id]);
      legacyCustomerName = (customerRow && customerRow.name) ? customerRow.name : 'Unknown';
    }

    // Build a portable INSERT matching the live schema
    const insertColumns = [
      'id','quotation_number','total_amount','currency','valid_until','terms',
      'scope_of_work','scope_of_work_ar','created_by','customer_id',
      'subtotal','discount_type','discount_value','discount_amount','vat_rate','vat_amount'
    ];

    const insertValues = [
      quotationId,
      quoteNumber,
      numericAmount,
      (currency || 'SAR'),
      valid_until,
      terms,
      (scopeOfWork || ''),
      (scopeOfWorkAr || ''),
      req.user.id,
      (customer_id || null),
      (subtotal !== undefined ? subtotal : numericAmount),
      (discountType !== undefined ? discountType : 'percentage'),
      (discountValue !== undefined ? discountValue : 0),
      (discountAmount !== undefined ? discountAmount : 0),
      (vatRate !== undefined ? vatRate : 15),
      (vatAmount !== undefined ? vatAmount : 0)
    ];

    if (includeCustomerName) {
      insertColumns.push('customer_name');
      insertValues.push(legacyCustomerName ?? 'Unknown');
    }

    if (includeItems) {
      insertColumns.push('items');
      insertValues.push(JSON.stringify(Array.isArray(lineItems) ? lineItems : []));
    }

    const placeholders = insertColumns.map(() => '?').join(',');
    await run(
      `INSERT INTO quotations (${insertColumns.join(',')}) VALUES (${placeholders})`,
      insertValues
    );
    
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await run(
          `INSERT INTO quotation_line_items (id, quotation_id, description, quantity, unit, custom_unit, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, quotationId, item.description || item.name || '', item.quantity, item.unit || 'piece', item.customUnit || null, item.unitPrice, item.total]
        );
      }
    }
    
    res.status(201).json({ 
      message: 'Quotation created successfully',
      quotation: { id: quotationId, quotation_number: quoteNumber }
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    if (error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update quotation
router.put('/:id', authenticateToken, requirePermission('quotations', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Update quotation request for ID:', id);
    console.log('Request body:', req.body);
    
    const { 
      amount, 
      total_amount, 
      currency, 
      valid_until, 
      terms, 
      scopeOfWork,
      scopeOfWorkAr,
      status, 
      customer_id,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatRate,
      vatAmount,
      total
    } = req.body;

    const finalAmount = amount || total_amount || total;
    console.log('Final amount calculated:', finalAmount, 'from:', { amount, total_amount, total });
    
    if (finalAmount && isNaN(finalAmount)) {
      console.log('Amount validation failed - isNaN:', finalAmount);
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const updateFields = [];
    const updateValues = [];

    if (finalAmount !== undefined) {
      updateFields.push('total_amount = ?');
      updateValues.push(parseFloat(finalAmount));
    }

    if (currency !== undefined) {
      updateFields.push('currency = ?');
      updateValues.push(currency);
    }

    if (valid_until !== undefined) {
      updateFields.push('valid_until = ?');
      updateValues.push(valid_until);
    }

    if (terms !== undefined) {
      updateFields.push('terms = ?');
      updateValues.push(terms);
    }

    if (scopeOfWork !== undefined) {
      updateFields.push('scope_of_work = ?');
      updateValues.push(scopeOfWork);
    }

    if (scopeOfWorkAr !== undefined) {
      updateFields.push('scope_of_work_ar = ?');
      updateValues.push(scopeOfWorkAr);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (customer_id !== undefined) {
      updateFields.push('customer_id = ?');
      updateValues.push(customer_id);
    }

    if (subtotal !== undefined) {
      updateFields.push('subtotal = ?');
      updateValues.push(parseFloat(subtotal));
    }

    if (discountType !== undefined) {
      updateFields.push('discount_type = ?');
      updateValues.push(discountType);
    }

    if (discountValue !== undefined) {
      updateFields.push('discount_value = ?');
      updateValues.push(parseFloat(discountValue));
    }

    if (discountAmount !== undefined) {
      updateFields.push('discount_amount = ?');
      updateValues.push(parseFloat(discountAmount));
    }

    if (vatRate !== undefined) {
      updateFields.push('vat_rate = ?');
      updateValues.push(parseFloat(vatRate));
    }

    if (vatAmount !== undefined) {
      updateFields.push('vat_amount = ?');
      updateValues.push(parseFloat(vatAmount));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(id);

    await run(
      `UPDATE quotations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Update line items if provided
    if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
      // Delete existing line items
      await run('DELETE FROM quotation_line_items WHERE quotation_id = ?', [id]);
      
      // Insert new line items
      for (const item of req.body.lineItems) {
        const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await run(
          `INSERT INTO quotation_line_items (id, quotation_id, description, quantity, unit, custom_unit, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.description || item.name || '', item.quantity, item.unit || 'piece', item.customUnit || null, item.unitPrice, item.total]
        );
      }
    }

    res.json({ message: 'Quotation updated successfully' });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete quotation
router.delete('/:id', authenticateToken, requirePermission('quotations', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete line items first (due to foreign key constraint)
    await run('DELETE FROM quotation_line_items WHERE quotation_id = ?', [id]);
    
    // Delete quotation
    const result = await run('DELETE FROM quotations WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 