const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { run, all, get } = require('../db');

const dbClient = (process.env.DB_CLIENT || 'sqlite').toLowerCase();

// Generate quote number
const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const rows = await all(
    `SELECT quotation_number FROM quotations WHERE quotation_number LIKE ?`,
    [`Q-${year}-%`]
  );

  let maxSequence = 0;
  for (const row of rows) {
    const value = row.quotation_number || '';
    const match = value.match(new RegExp(`^Q-${year}-(\\d+)$`));
    if (!match) continue;
    const sequence = Number(match[1]);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `Q-${year}-${String(maxSequence + 1).padStart(4, '0')}`;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTableColumnNames = async (tableName) => {
  if (dbClient === 'mysql') {
    const columns = await all(`SHOW COLUMNS FROM ${tableName}`);
    return new Set(columns.map((column) => column.Field));
  }

  const columns = await all(`PRAGMA table_info(${tableName})`);
  return new Set(columns.map((column) => column.name));
};

const addColumnIfMissing = async (tableName, columnName, sqliteDefinition, mysqlDefinition) => {
  const columnNames = await getTableColumnNames(tableName);
  if (columnNames.has(columnName)) return;

  const definition = dbClient === 'mysql' ? mysqlDefinition : sqliteDefinition;
  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
};

const ensureQuotationLineItemColumns = async () => {
  await addColumnIfMissing('quotation_line_items', 'item_code', 'TEXT', 'VARCHAR(255) NULL');
  await addColumnIfMissing('quotation_line_items', 'unit', "TEXT DEFAULT 'piece'", "VARCHAR(50) DEFAULT 'piece'");
  await addColumnIfMissing('quotation_line_items', 'custom_unit', 'TEXT', 'VARCHAR(100) NULL');
};

// Get all quotations
router.get('/', authenticateToken, requirePermission('quotations', 'read'), async (req, res) => {
  try {
    await ensureQuotationLineItemColumns();
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
    await ensureQuotationLineItemColumns();
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
    await ensureQuotationLineItemColumns();
    const { 
      amount, 
      total_amount, 
      currency, 
      valid_until, 
      terms, 
      notes,
      scopeOfWork,
      scopeOfWorkAr,
      lineItems, 
      customer_id,
      customerId,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatRate,
      vatAmount,
      total
    } = req.body;
    
    const finalAmount = amount ?? total_amount ?? total;
    
    if (!finalAmount || isNaN(finalAmount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    const numericAmount = parseFloat(finalAmount);
    let normalizedCustomerId = customer_id ?? customerId ?? null;
    const normalizedTerms = terms ?? notes ?? '';
    let normalizedCreatedBy = req.user?.id || null;

    if (normalizedCustomerId !== null && normalizedCustomerId !== undefined) {
      normalizedCustomerId = String(normalizedCustomerId).trim();
    }

    if (normalizedCustomerId) {
      const existingCustomer = await get('SELECT id, name FROM customers WHERE id = ?', [normalizedCustomerId]);
      if (!existingCustomer) {
        console.warn('Quotation create: customer_id not found, falling back to null:', normalizedCustomerId);
        normalizedCustomerId = null;
      }
    } else {
      normalizedCustomerId = null;
    }

    if (normalizedCreatedBy) {
      const existingUser = await get('SELECT id FROM users WHERE id = ?', [normalizedCreatedBy]);
      if (!existingUser) {
        console.warn('Quotation create: created_by not found, falling back to null:', normalizedCreatedBy);
        normalizedCreatedBy = null;
      }
    }
    
    const quotationId = Date.now().toString();
    const quoteNumber = await generateQuoteNumber();
    
    // Detect legacy columns for backward compatibility on existing VPS DBs
    const columnNames = await getTableColumnNames('quotations');

    // Some deployments have NOT NULL customer_name and an items JSON column
    const includeCustomerName = columnNames.has('customer_name');
    const includeItems = columnNames.has('items');

    // Resolve customer name when customer_id provided
    let legacyCustomerName = null;
    if (includeCustomerName && normalizedCustomerId) {
      const customerRow = await get('SELECT name FROM customers WHERE id = ?', [normalizedCustomerId]);
      legacyCustomerName = (customerRow && customerRow.name) ? customerRow.name : 'Unknown';
    }

    // Build a portable INSERT matching the live schema
    const portableFields = [
      { candidates: ['quotation_number', 'quote_number'], value: quoteNumber },
      { candidates: ['total_amount', 'amount'], value: numericAmount },
      { candidates: ['currency'], value: currency || 'SAR' },
      { candidates: ['valid_until'], value: valid_until },
      { candidates: ['terms', 'notes'], value: normalizedTerms },
      { candidates: ['scope_of_work'], value: scopeOfWork || '' },
      { candidates: ['scope_of_work_ar'], value: scopeOfWorkAr || '' },
      { candidates: ['created_by'], value: normalizedCreatedBy },
      { candidates: ['customer_id'], value: normalizedCustomerId },
      { candidates: ['subtotal'], value: subtotal !== undefined ? toNumber(subtotal, numericAmount) : numericAmount },
      { candidates: ['discount_type'], value: discountType !== undefined ? discountType : 'percentage' },
      { candidates: ['discount_value'], value: discountValue !== undefined ? toNumber(discountValue, 0) : 0 },
      { candidates: ['discount_amount'], value: discountAmount !== undefined ? toNumber(discountAmount, 0) : 0 },
      { candidates: ['vat_rate'], value: vatRate !== undefined ? toNumber(vatRate, 15) : 15 },
      { candidates: ['vat_amount'], value: vatAmount !== undefined ? toNumber(vatAmount, 0) : 0 },
    ];

    const insertColumns = ['id'];
    const insertValues = [quotationId];

    for (const field of portableFields) {
      if (field.value === undefined) continue;

      const column = field.candidates.find(candidate => columnNames.has(candidate));
      if (column) {
        insertColumns.push(column);
        insertValues.push(field.value);
      }
    }

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
          `INSERT INTO quotation_line_items (id, quotation_id, item_code, description, quantity, unit, custom_unit, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            quotationId,
            item.itemCode || item.item_code || item.code || item.sku || item.partNumber || '',
            item.description || item.name || '',
            toNumber(item.quantity, 0),
            item.unit || 'piece',
            item.customUnit || null,
            toNumber(item.unitPrice, 0),
            toNumber(item.total, toNumber(item.quantity, 0) * toNumber(item.unitPrice, 0))
          ]
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
    await ensureQuotationLineItemColumns();
    const { id } = req.params;
    console.log('Update quotation request for ID:', id);
    console.log('Request body:', req.body);
    
    const { 
      amount, 
      total_amount, 
      currency, 
      valid_until, 
      terms, 
      notes,
      scopeOfWork,
      scopeOfWorkAr,
      status, 
      customer_id,
      customerId,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatRate,
      vatAmount,
      total
    } = req.body;

    const finalAmount = amount ?? total_amount ?? total;
    console.log('Final amount calculated:', finalAmount, 'from:', { amount, total_amount, total });
    
    if (finalAmount && isNaN(finalAmount)) {
      console.log('Amount validation failed - isNaN:', finalAmount);
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const columnNames = await getTableColumnNames('quotations');
    const updateFields = [];
    const updateValues = [];
    let normalizedCustomerId = customer_id ?? customerId;
    const normalizedTerms = terms ?? notes;

    if (normalizedCustomerId !== undefined && normalizedCustomerId !== null) {
      normalizedCustomerId = String(normalizedCustomerId).trim();
      if (normalizedCustomerId) {
        const existingCustomer = await get('SELECT id FROM customers WHERE id = ?', [normalizedCustomerId]);
        if (!existingCustomer) {
          console.warn('Quotation update: customer_id not found, falling back to null:', normalizedCustomerId);
          normalizedCustomerId = null;
        }
      } else {
        normalizedCustomerId = null;
      }
    }

    const setIfColumnExists = (candidates, value, transform = (v) => v) => {
      if (value === undefined) return;
      const column = candidates.find(candidate => columnNames.has(candidate));
      if (!column) return;
      updateFields.push(`${column} = ?`);
      updateValues.push(transform(value));
    };

    setIfColumnExists(['total_amount', 'amount'], finalAmount, (v) => parseFloat(v));
    setIfColumnExists(['currency'], currency);
    setIfColumnExists(['valid_until'], valid_until);
    setIfColumnExists(['terms', 'notes'], normalizedTerms, (v) => v ?? '');
    setIfColumnExists(['scope_of_work'], scopeOfWork, (v) => v ?? '');
    setIfColumnExists(['scope_of_work_ar'], scopeOfWorkAr, (v) => v ?? '');
    setIfColumnExists(['status'], status);
    setIfColumnExists(['customer_id'], normalizedCustomerId);
    setIfColumnExists(['subtotal'], subtotal, (v) => toNumber(v, 0));
    setIfColumnExists(['discount_type'], discountType);
    setIfColumnExists(['discount_value'], discountValue, (v) => toNumber(v, 0));
    setIfColumnExists(['discount_amount'], discountAmount, (v) => toNumber(v, 0));
    setIfColumnExists(['vat_rate'], vatRate, (v) => toNumber(v, 15));
    setIfColumnExists(['vat_amount'], vatAmount, (v) => toNumber(v, 0));

    if (columnNames.has('customer_name') && normalizedCustomerId !== undefined) {
      let legacyCustomerName = 'Unknown';
      if (normalizedCustomerId) {
        const customerRow = await get('SELECT name FROM customers WHERE id = ?', [normalizedCustomerId]);
        if (customerRow?.name) {
          legacyCustomerName = customerRow.name;
        }
      }
      updateFields.push('customer_name = ?');
      updateValues.push(legacyCustomerName);
    }

    if (columnNames.has('items') && req.body.lineItems !== undefined) {
      updateFields.push('items = ?');
      updateValues.push(JSON.stringify(Array.isArray(req.body.lineItems) ? req.body.lineItems : []));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (columnNames.has('updated_at')) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
    }

    updateValues.push(id);

    await run(
      `UPDATE quotations SET ${updateFields.join(', ')} WHERE id = ?`,
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
          `INSERT INTO quotation_line_items (id, quotation_id, item_code, description, quantity, unit, custom_unit, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.itemCode || item.item_code || item.code || item.sku || item.partNumber || '',
            item.description || item.name || '',
            toNumber(item.quantity, 0),
            item.unit || 'piece',
            item.customUnit || null,
            toNumber(item.unitPrice, 0),
            toNumber(item.total, toNumber(item.quantity, 0) * toNumber(item.unitPrice, 0))
          ]
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