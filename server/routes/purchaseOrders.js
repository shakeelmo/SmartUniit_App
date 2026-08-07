const express = require('express');
const { run, all, get } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

const purchaseOrderRelations = `
  LEFT JOIN vendors v ON BINARY po.vendor_id = BINARY v.id
  LEFT JOIN customers c ON BINARY po.customer_id = BINARY c.id
  LEFT JOIN users u ON BINARY po.created_by = BINARY u.id
`;

const purchaseOrderPartyJoins = `
  LEFT JOIN vendors v ON BINARY po.vendor_id = BINARY v.id
  LEFT JOIN customers c ON BINARY po.customer_id = BINARY c.id
`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generatePurchaseOrderNumber = async () => {
  const year = new Date().getFullYear();
  const rows = await all(
    'SELECT po_number FROM purchase_orders WHERE po_number LIKE ?',
    [`PO-${year}-%`]
  );

  let maxSequence = 0;
  for (const row of rows) {
    const value = row.po_number || '';
    const match = value.match(new RegExp(`^PO-${year}-(\\d+)$`));
    if (!match) continue;
    const sequence = Number(match[1]);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `PO-${year}-${String(maxSequence + 1).padStart(4, '0')}`;
};

const fetchPurchaseOrderLineItems = async (purchaseOrderId) => {
  return all(
    `SELECT *
     FROM purchase_order_line_items
     WHERE purchase_order_id = ?
     ORDER BY created_at ASC`,
    [purchaseOrderId]
  );
};

const serializePurchaseOrder = async (purchaseOrder) => {
  const lineItems = await fetchPurchaseOrderLineItems(purchaseOrder.id);
  return { ...purchaseOrder, lineItems };
};

// Get all purchase orders
router.get('/', authenticateToken, requirePermission('purchase_orders', 'read'), async (req, res) => {
  try {
    const { search, status, direction, vendor_id, customer_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += ` AND (
        po.po_number LIKE ?
        OR po.reference_number LIKE ?
        OR po.quotation_reference LIKE ?
        OR v.name LIKE ?
        OR c.name LIKE ?
        OR c.company LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND po.status = ?';
      params.push(status);
    }

    if (direction) {
      whereClause += ' AND po.direction = ?';
      params.push(direction);
    }

    if (vendor_id) {
      whereClause += ' AND po.vendor_id = ?';
      params.push(vendor_id);
    }

    if (customer_id) {
      whereClause += ' AND po.customer_id = ?';
      params.push(customer_id);
    }

    const purchaseOrders = await all(
      `SELECT
         po.*,
         v.name AS vendor_name,
         v.contact_person AS vendor_contact_person,
         v.email AS vendor_email,
         v.phone AS vendor_phone,
         v.address AS vendor_address,
         c.name AS customer_name,
         c.company AS customer_company,
         c.email AS customer_email,
         c.phone AS customer_phone,
         c.address AS customer_address,
         u.name AS created_by_name
       FROM purchase_orders po
       ${purchaseOrderRelations}
       ${whereClause}
       ORDER BY po.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    for (const purchaseOrder of purchaseOrders) {
      purchaseOrder.lineItems = await fetchPurchaseOrderLineItems(purchaseOrder.id);
    }

    const countResult = await get(
      `SELECT COUNT(*) AS total
       FROM purchase_orders po
       ${purchaseOrderPartyJoins}
       ${whereClause}`,
      params
    );

    res.json({
      purchaseOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single purchase order
router.get('/:id', authenticateToken, requirePermission('purchase_orders', 'read'), async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await get(
      `SELECT
         po.*,
         v.name AS vendor_name,
         v.contact_person AS vendor_contact_person,
         v.email AS vendor_email,
         v.phone AS vendor_phone,
         v.address AS vendor_address,
         c.name AS customer_name,
         c.company AS customer_company,
         c.email AS customer_email,
         c.phone AS customer_phone,
         c.address AS customer_address,
         u.name AS created_by_name
       FROM purchase_orders po
       ${purchaseOrderRelations}
       WHERE po.id = ?`,
      [id]
    );

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ purchaseOrder: await serializePurchaseOrder(purchaseOrder) });
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase order
router.post('/', authenticateToken, requirePermission('purchase_orders', 'create'), async (req, res) => {
  try {
    const {
      po_number,
      direction,
      vendor_id,
      customer_id,
      status,
      po_date,
      reference_number,
      quotation_reference,
      currency,
      lineItems,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      vat_rate,
      vat_amount,
      total,
      notes,
      delivery_address,
      payment_terms,
      company_contact_name,
      company_contact_phone,
      company_contact_email,
    } = req.body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }

    if (!vendor_id && !customer_id) {
      return res.status(400).json({ error: 'Vendor or customer is required' });
    }

    const purchaseOrderId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const purchaseOrderNumber = po_number || await generatePurchaseOrderNumber();

    await run(
      `INSERT INTO purchase_orders (
         id, po_number, direction, vendor_id, customer_id, status, po_date,
         reference_number, quotation_reference, currency, subtotal, discount_type,
         discount_value, discount_amount, vat_rate,
         vat_amount, total_amount, notes, delivery_address, payment_terms,
         company_contact_name, company_contact_phone, company_contact_email, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchaseOrderId,
        purchaseOrderNumber,
        direction || 'issued',
        vendor_id || null,
        customer_id || null,
        status || 'draft',
        po_date || new Date().toISOString().split('T')[0],
        reference_number || null,
        quotation_reference || null,
        currency || 'SAR',
        toNumber(subtotal, 0),
        discount_type === 'fixed' ? 'fixed' : 'percentage',
        toNumber(discount_value, 0),
        toNumber(discount_amount, 0),
        toNumber(vat_rate, 15),
        toNumber(vat_amount, 0),
        toNumber(total, 0),
        notes || '',
        delivery_address || '',
        payment_terms || '',
        company_contact_name || '',
        company_contact_phone || '',
        company_contact_email || '',
        req.user.id,
      ]
    );

    for (const item of lineItems) {
      await run(
        `INSERT INTO purchase_order_line_items (
           id, purchase_order_id, item_code, description, quantity, unit, unit_price, total_price
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
          purchaseOrderId,
          item.item_code || item.itemCode || '',
          item.description || '',
          toNumber(item.quantity, 1),
          item.unit || 'pcs',
          toNumber(item.unit_price ?? item.unitPrice, 0),
          toNumber(item.total_price ?? item.total, 0),
        ]
      );
    }

    const createdPurchaseOrder = await get('SELECT * FROM purchase_orders WHERE id = ?', [purchaseOrderId]);
    res.status(201).json({
      message: 'Purchase order created successfully',
      purchaseOrder: await serializePurchaseOrder(createdPurchaseOrder),
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase order
router.put('/:id', authenticateToken, requirePermission('purchase_orders', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const existingPurchaseOrder = await get('SELECT * FROM purchase_orders WHERE id = ?', [id]);

    if (!existingPurchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const {
      po_number,
      direction,
      vendor_id,
      customer_id,
      status,
      po_date,
      reference_number,
      quotation_reference,
      currency,
      lineItems,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      vat_rate,
      vat_amount,
      total,
      notes,
      delivery_address,
      payment_terms,
      company_contact_name,
      company_contact_phone,
      company_contact_email,
    } = req.body;

    await run(
      `UPDATE purchase_orders
       SET po_number = ?, direction = ?, vendor_id = ?, customer_id = ?, status = ?,
           po_date = ?, reference_number = ?, quotation_reference = ?, currency = ?,
           subtotal = ?, discount_type = ?, discount_value = ?, discount_amount = ?,
           vat_rate = ?, vat_amount = ?, total_amount = ?, notes = ?,
           delivery_address = ?, payment_terms = ?, company_contact_name = ?,
           company_contact_phone = ?, company_contact_email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        po_number || existingPurchaseOrder.po_number,
        direction || existingPurchaseOrder.direction,
        vendor_id || null,
        customer_id || null,
        status || existingPurchaseOrder.status,
        po_date || existingPurchaseOrder.po_date,
        reference_number || '',
        quotation_reference || '',
        currency || existingPurchaseOrder.currency || 'SAR',
        toNumber(subtotal, existingPurchaseOrder.subtotal),
        discount_type === 'fixed' ? 'fixed' : (discount_type === 'percentage' ? 'percentage' : existingPurchaseOrder.discount_type || 'percentage'),
        toNumber(discount_value, existingPurchaseOrder.discount_value),
        toNumber(discount_amount, existingPurchaseOrder.discount_amount),
        toNumber(vat_rate, existingPurchaseOrder.vat_rate),
        toNumber(vat_amount, existingPurchaseOrder.vat_amount),
        toNumber(total, existingPurchaseOrder.total_amount),
        notes ?? existingPurchaseOrder.notes ?? '',
        delivery_address ?? existingPurchaseOrder.delivery_address ?? '',
        payment_terms ?? existingPurchaseOrder.payment_terms ?? '',
        company_contact_name ?? existingPurchaseOrder.company_contact_name ?? '',
        company_contact_phone ?? existingPurchaseOrder.company_contact_phone ?? '',
        company_contact_email ?? existingPurchaseOrder.company_contact_email ?? '',
        id,
      ]
    );

    if (Array.isArray(lineItems)) {
      await run('DELETE FROM purchase_order_line_items WHERE purchase_order_id = ?', [id]);

      for (const item of lineItems) {
        await run(
          `INSERT INTO purchase_order_line_items (
             id, purchase_order_id, item_code, description, quantity, unit, unit_price, total_price
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
            id,
            item.item_code || item.itemCode || '',
            item.description || '',
            toNumber(item.quantity, 1),
            item.unit || 'pcs',
            toNumber(item.unit_price ?? item.unitPrice, 0),
            toNumber(item.total_price ?? item.total, 0),
          ]
        );
      }
    }

    const updatedPurchaseOrder = await get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    res.json({
      message: 'Purchase order updated successfully',
      purchaseOrder: await serializePurchaseOrder(updatedPurchaseOrder),
    });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete purchase order
router.delete('/:id', authenticateToken, requirePermission('purchase_orders', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const existingPurchaseOrder = await get('SELECT id FROM purchase_orders WHERE id = ?', [id]);

    if (!existingPurchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await run('DELETE FROM purchase_order_line_items WHERE purchase_order_id = ?', [id]);
    await run('DELETE FROM purchase_orders WHERE id = ?', [id]);

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
