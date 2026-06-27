const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const dbClient = (process.env.DB_CLIENT || 'sqlite').toLowerCase();

const sanitizeFullData = (value, key = '') => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    const isImageData = value.startsWith('data:image/');
    const isAllowedLogo = key === 'customerLogo' && isImageData && value.length <= 3 * 1024 * 1024;
    return value.startsWith('data:') && !isAllowedLogo ? undefined : value;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => sanitizeFullData(item, key))
      .filter(item => item !== undefined);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([childKey]) => childKey !== 'logoFile')
        .map(([childKey, item]) => [childKey, sanitizeFullData(item, childKey)])
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

const getProposalColumnNames = async () => {
  if (dbClient === 'mysql') {
    const columns = await all('SHOW COLUMNS FROM proposals');
    return new Set(columns.map((column) => column.Field));
  }

  const columns = await all('PRAGMA table_info(proposals)');
  return new Set(columns.map((column) => column.name));
};

const ensureFullDataColumn = async () => {
  try {
    const columnNames = await getProposalColumnNames();
    if (columnNames.has('full_data')) return;

    await run('ALTER TABLE proposals ADD COLUMN full_data TEXT');
    console.log('Added proposals.full_data column');
  } catch (error) {
    console.error('Ensure proposals.full_data failed:', error);
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

const updateProposalRecord = async (id, payload) => {
  const fullDataPayload = sanitizeFullData(payload);
  const existingProposal = await get('SELECT * FROM proposals WHERE id = ?', [id]);
  if (!existingProposal) return null;

  let existingFullData = {};
  try {
    if (existingProposal.full_data) {
      existingFullData = JSON.parse(existingProposal.full_data);
    }
  } catch (error) {
    console.error('Failed to parse existing proposal full_data during update:', error);
  }

  const mergedFullData = {
    ...existingFullData,
    ...fullDataPayload
  };

  const title = payload.title ?? existingProposal.title ?? existingFullData.title ?? '';
  const description = payload.description ?? existingProposal.description ?? existingFullData.description ?? '';
  const customerId = payload.customerId ?? payload.customer_id ?? existingProposal.customer_id ?? existingFullData.customerId ?? null;
  const vendorId = payload.vendorId ?? payload.vendor_id ?? existingProposal.vendor_id ?? existingFullData.vendorId ?? null;
  const value = payload.value ?? existingProposal.value ?? existingFullData.value ?? 0;
  const status = payload.status ?? existingProposal.status ?? existingFullData.status ?? 'draft';

  await run(
    `UPDATE proposals
     SET title = ?, description = ?, customer_id = ?, vendor_id = ?, value = ?, status = ?, full_data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title || '', description || '', customerId || null, vendorId || null, value || 0, status || 'draft', JSON.stringify(mergedFullData), id]
  );

  return get('SELECT * FROM proposals WHERE id = ?', [id]);
};

const handleUpdateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updatedProposal = await updateProposalRecord(id, payload);
    if (!updatedProposal) return res.status(404).json({ error: 'Proposal not found' });

    res.json({
      message: 'Proposal updated successfully',
      proposal: parseFullData(updatedProposal)
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.put('/:id', authenticateToken, requirePermission('proposals', 'update'), handleUpdateProposal);
router.post('/:id/update', authenticateToken, requirePermission('proposals', 'update'), handleUpdateProposal);

router.post('/:id/section/:section', authenticateToken, requirePermission('proposals', 'update'), async (req, res) => {
  try {
    const { id, section } = req.params;
    const value = sanitizeFullData(req.body?.value, section);
    const payload = { [section]: value };

    const updatedProposal = await updateProposalRecord(id, payload);
    if (!updatedProposal) return res.status(404).json({ error: 'Proposal not found' });

    res.json({
      message: 'Proposal section updated successfully',
      proposal: parseFullData(updatedProposal)
    });
  } catch (error) {
    console.error('Update proposal section error:', error);
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
