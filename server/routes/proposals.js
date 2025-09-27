const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all proposals
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
    
    // Get proposals with pagination
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
    
    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM proposals p ${whereClause}`,
      params
    );
    
    res.json({
      proposals,
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

// Get single proposal
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
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    res.json({ proposal });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new proposal
router.post('/', authenticateToken, requirePermission('proposals', 'create'), async (req, res) => {
  try {
    const { title, description, customerId } = req.body;
    
    if (!title || !customerId) {
      return res.status(400).json({ error: 'Title and customer are required' });
    }
    
    const proposalId = Date.now().toString();
    
    await run(
      `INSERT INTO proposals (id, title, description, customer_id, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, title, description, customerId, req.user.id]
    );
    
    const newProposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);
    
    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: newProposal
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update proposal
router.put('/:id', authenticateToken, requirePermission('proposals', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, customerId, vendorId, value, status } = req.body;
    
    // Check if proposal exists
    const existingProposal = await get('SELECT id FROM proposals WHERE id = ?', [id]);
    if (!existingProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    await run(
      `UPDATE proposals 
       SET title = ?, description = ?, customer_id = ?, vendor_id = ?, value = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, customerId, vendorId, value, status, id]
    );
    
    const updatedProposal = await get('SELECT * FROM proposals WHERE id = ?', [id]);
    
    res.json({
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete proposal
router.delete('/:id', authenticateToken, requirePermission('proposals', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if proposal exists
    const existingProposal = await get('SELECT id FROM proposals WHERE id = ?', [id]);
    if (!existingProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    await run('DELETE FROM proposals WHERE id = ?', [id]);
    
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 