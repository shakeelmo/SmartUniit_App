const express = require('express');
const { run, get, all } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, requirePermission('projects', 'read'), async (req, res) => {
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
    
    // Get projects with pagination
    const projects = await all(
      `SELECT p.*, c.name as customer_name, u.name as manager_name 
       FROM projects p 
       LEFT JOIN customers c ON p.customer_id = c.id 
       LEFT JOIN users u ON p.manager_id = u.id 
       ${whereClause} 
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get total count
    const countResult = await get(
      `SELECT COUNT(*) as total FROM projects p ${whereClause}`,
      params
    );
    
    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project
router.get('/:id', authenticateToken, requirePermission('projects', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await get(
      `SELECT p.*, c.name as customer_name, u.name as manager_name 
       FROM projects p 
       LEFT JOIN customers c ON p.customer_id = c.id 
       LEFT JOIN users u ON p.manager_id = u.id 
       WHERE p.id = ?`,
      [id]
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new project
router.post('/', authenticateToken, requirePermission('projects', 'create'), async (req, res) => {
  try {
    const { title, description, customerId, managerId, startDate, endDate, budget, priority } = req.body;
    
    if (!title || !customerId) {
      return res.status(400).json({ error: 'Title and customer are required' });
    }
    
    const projectId = Date.now().toString();
    
    await run(
      `INSERT INTO projects (id, name, description, customer_id, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, title, description, customerId, req.user.id]
    );
    
    const newProject = await get('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', authenticateToken, requirePermission('projects', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, customerId, status } = req.body;
    
    // Check if project exists
    const existingProject = await get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await run(
      `UPDATE projects 
       SET name = ?, description = ?, customer_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, customerId, status, id]
    );
    
    const updatedProject = await get('SELECT * FROM projects WHERE id = ?', [id]);
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, requirePermission('projects', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const existingProject = await get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project has associated tasks
    const associatedTasks = await get(
      'SELECT id FROM tasks WHERE project_id = ? LIMIT 1',
      [id]
    );
    
    if (associatedTasks) {
      return res.status(400).json({ 
        error: 'Cannot delete project with associated tasks. Please delete tasks first.' 
      });
    }
    
    await run('DELETE FROM projects WHERE id = ?', [id]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 