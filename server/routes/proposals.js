const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

const sanitizeFullData = (value) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.startsWith('data:') ? undefined : value;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => sanitizeFullData(item))
      .filter(item => item !== undefined);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, sanitizeFullData(item)])
        .filter(([, item]) => item !== undefined)
    );
  }

  return value;
};

const parseFullData = (row) => {
  if (!row) return row;
  let fullData = {};
  try {
    if (row.full_data) fullData = JSON.parse(row.full_data);
  } catch (error) {
    console.error('Failed to parse proposal full_data:', error);
  }

  return {
    ...fullData,
    ...row,
    customerId: row.customer_id || fullData.customerId,
    vendorId: row.vendor_id || fullData.vendorId,
    createdBy: row.created_by || fullData.createdBy,
    createdAt: row.created_at || fullData.createdAt,
    updatedAt: row.updated_at || fullData.updatedAt
  };
};

const ensureFullDataColumn = async () => {
  try {
    await run('ALTER TABLE proposals ADD COLUMN full_data TEXT');
    console.log('Added proposals.full_data column');
  } catch (error) {
    if (!String(error.message || '').includes('duplicate column name')) {
      console.error('Ensure proposals.full_data failed:', error);
    }
  }
};
ensureFullDataColumn();

router.get('/', authenticateToken, requirePermission('proposals', 'read'), async (req, res) => {
  try {
    const { search, status, customer_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND customer_id = ?';
      params.push(customer_id);
    }

    const proposals = await all(
      `SELECT p.*, c.name as customer_name, v.name as vendor_name, u.name as created_by_name
       FROM proposals p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN vendors v ON p.vendor_id = v.id
       LEFT JOIN users u ON p.created_by = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countResult = await get(`SELECT COUNT(*) as total FROM proposals p ${whereClause}`, params);

    res.json({
      proposals: proposals.map(parseFullData),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, requirePermission('proposals', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await get(
      `SELECT p.*, c.name as customer_name, v.name as vendor_name, u.name as created_by_name
       FROM proposals p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN vendors v ON p.vendor_id = v.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json({ proposal: parseFullData(proposal) });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requirePermission('proposals', 'create'), async (req, res) => {
  try {
    const payload = req.body || {};
    const fullData = sanitizeFullData(payload);
    const { title, description, customerId, vendorId, value, status = 'draft' } = payload;

    if (!title || !customerId) {
      return res.status(400).json({ error: 'Title and customer are required' });
    }

    const proposalId = Date.now().toString();

    await run(
      `INSERT INTO proposals (id, title, description, customer_id, vendor_id, status, value, created_by, full_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [proposalId, title, description || '', customerId, vendorId || null, status, value || 0, req.user.id, JSON.stringify(fullData)]
    );

    const newProposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);

    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: parseFullData(newProposal)
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requirePermission('proposals', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const fullData = sanitizeFullData(payload);
    const { title, description, customerId, vendorId, value, status } = payload;

    const existingProposal = await get('SELECT id FROM proposals WHERE id = ?', [id]);
    if (!existingProposal) return res.status(404).json({ error: 'Proposal not found' });

    await run(
      `UPDATE proposals
       SET title = ?, description = ?, customer_id = ?, vendor_id = ?, value = ?, status = ?, full_data = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title || '', description || '', customerId || null, vendorId || null, value || 0, status || 'draft', JSON.stringify(fullData), id]
    );

    const updatedProposal = await get('SELECT * FROM proposals WHERE id = ?', [id]);

    res.json({
      message: 'Proposal updated successfully',
      proposal: parseFullData(updatedProposal)
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requirePermission('proposals', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const existingProposal = await get('SELECT id FROM proposals WHERE id = ?', [id]);
    if (!existingProposal) return res.status(404).json({ error: 'Proposal not found' });

    await run('DELETE FROM proposals WHERE id = ?', [id]);
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
