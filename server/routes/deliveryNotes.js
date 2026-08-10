const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

const generateNoteNumber = async () => {
  const year = new Date().getFullYear();
  const rows = await all(
    'SELECT note_number FROM delivery_notes WHERE note_number LIKE ?',
    [`DN-${year}-%`]
  );

  let maxSequence = 0;
  for (const row of rows) {
    const value = row.note_number || '';
    const match = value.match(new RegExp(`^DN-${year}-(\\d+)$`));
    if (!match) continue;
    const sequence = Number(match[1]);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `DN-${year}-${String(maxSequence + 1).padStart(4, '0')}`;
};

// Get all delivery notes
router.get('/', authenticateToken, requirePermission('delivery_notes', 'read'), async (req, res) => {
  try {
    const notes = await all(
      `SELECT dn.*, c.name as customer_name, u.name as created_by_name
       FROM delivery_notes dn
       LEFT JOIN customers c ON BINARY dn.customer_id = BINARY c.id
       LEFT JOIN users u ON BINARY dn.created_by = BINARY u.id
       ORDER BY dn.created_at DESC`
    );
    res.json({ deliveryNotes: notes });
  } catch (error) {
    console.error('Get delivery notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single delivery note
router.get('/:id', authenticateToken, requirePermission('delivery_notes', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const note = await get(
      `SELECT dn.*, c.name as customer_name, u.name as created_by_name
       FROM delivery_notes dn
       LEFT JOIN customers c ON BINARY dn.customer_id = BINARY c.id
       LEFT JOIN users u ON BINARY dn.created_by = BINARY u.id
       WHERE dn.id = ?`,
      [id]
    );
    if (!note) return res.status(404).json({ error: 'Delivery note not found' });
    const items = await all('SELECT * FROM delivery_note_items WHERE delivery_note_id = ?', [id]);
    res.json({ deliveryNote: { ...note, items } });
  } catch (error) {
    console.error('Get delivery note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create delivery note
router.post('/', authenticateToken, requirePermission('delivery_notes', 'create'), async (req, res) => {
  try {
    const { customer_id, invoice_id, delivery_date, recipient_name, signature, notes, status, items } = req.body;
    if (!customer_id || !delivery_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer, delivery date, and at least one item are required' });
    }
    const noteId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const noteNumber = await generateNoteNumber();
    await run(
      `INSERT INTO delivery_notes (id, note_number, customer_id, invoice_id, delivery_date, recipient_name, signature, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteId,
        noteNumber,
        customer_id,
        invoice_id || null,
        delivery_date,
        recipient_name || null,
        signature || null,
        notes || null,
        status || 'draft',
        req.user.id,
      ]
    );
    for (const item of items) {
      const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await run(
        `INSERT INTO delivery_note_items (id, delivery_note_id, description, quantity, unit, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, noteId, item.description, item.quantity, item.unit, item.remarks]
      );
    }
    const newNote = await get('SELECT * FROM delivery_notes WHERE id = ?', [noteId]);
    res.status(201).json({ message: 'Delivery note created', deliveryNote: newNote });
  } catch (error) {
    console.error('Create delivery note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update delivery note
router.put('/:id', authenticateToken, requirePermission('delivery_notes', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, recipient_name, signature, notes, status, items } = req.body;
    const existing = await get('SELECT * FROM delivery_notes WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Delivery note not found' });
    await run(
      `UPDATE delivery_notes SET delivery_date = ?, recipient_name = ?, signature = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        delivery_date ?? existing.delivery_date,
        recipient_name ?? existing.recipient_name,
        signature ?? existing.signature,
        notes ?? existing.notes,
        status ?? existing.status,
        id,
      ]
    );
    if (items && Array.isArray(items)) {
      await run('DELETE FROM delivery_note_items WHERE delivery_note_id = ?', [id]);
      for (const item of items) {
        const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await run(
          `INSERT INTO delivery_note_items (id, delivery_note_id, description, quantity, unit, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.description, item.quantity, item.unit, item.remarks]
        );
      }
    }
    const updatedNote = await get('SELECT * FROM delivery_notes WHERE id = ?', [id]);
    res.json({ message: 'Delivery note updated', deliveryNote: updatedNote });
  } catch (error) {
    console.error('Update delivery note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete delivery note
router.delete('/:id', authenticateToken, requirePermission('delivery_notes', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT id FROM delivery_notes WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Delivery note not found' });
    await run('DELETE FROM delivery_note_items WHERE delivery_note_id = ?', [id]);
    await run('DELETE FROM delivery_notes WHERE id = ?', [id]);
    res.json({ message: 'Delivery note deleted' });
  } catch (error) {
    console.error('Delete delivery note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
