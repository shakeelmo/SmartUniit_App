const express = require('express');
const { run, all, get } = require('../db');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

const REPORT_TABLE = 'project_completion_reports';

const generateReportNumber = async () => {
  const year = new Date().getFullYear();
  const rows = await all(
    `SELECT report_number FROM ${REPORT_TABLE} WHERE report_number LIKE ?`,
    [`PCR-${year}-%`]
  );

  let maxSequence = 0;
  for (const row of rows) {
    const value = row.report_number || '';
    const match = value.match(new RegExp(`^PCR-${year}-(\\d+)$`));
    if (!match) continue;
    const sequence = Number(match[1]);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `PCR-${year}-${String(maxSequence + 1).padStart(4, '0')}`;
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const serializeReport = (row) => {
  if (!row) return row;
  return {
    ...row,
    executionDetails: parseJson(row.execution_details, {}),
    photos: parseJson(row.photos, []),
    signatures: parseJson(row.signatures, []),
  };
};

// Get all project completion reports
router.get('/', authenticateToken, requirePermission('project_completion_reports', 'read'), async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR client_name LIKE ? OR report_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const reports = await all(
      `SELECT * FROM ${REPORT_TABLE} ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countResult = await get(
      `SELECT COUNT(*) as total FROM ${REPORT_TABLE} ${whereClause}`,
      params
    );

    res.json({
      reports: reports.map(serializeReport),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    console.error('Get project completion reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single report
router.get('/:id', authenticateToken, requirePermission('project_completion_reports', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const report = await get(`SELECT * FROM ${REPORT_TABLE} WHERE id = ?`, [id]);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report: serializeReport(report) });
  } catch (error) {
    console.error('Get project completion report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new report
router.post('/', authenticateToken, requirePermission('project_completion_reports', 'create'), async (req, res) => {
  try {
    const {
      title,
      subtitle,
      clientName,
      clientCompany,
      clientFormerName,
      clientLogo,
      clientRepName,
      clientRepDesignation,
      clientRepPhone,
      clientRepEmail,
      contractorName,
      contractorLogo,
      submissionDate,
      completionDate,
      version,
      projectLocation,
      projectManager,
      scopeOfWork,
      introduction,
      scopeContent,
      executionDetails,
      testingDetails,
      conclusion,
      photos,
      signatures,
      status,
    } = req.body;

    const reportNumber = await generateReportNumber();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);

    await run(
      `INSERT INTO ${REPORT_TABLE} (
        id, report_number, title, subtitle,
        client_name, client_company, client_former_name, client_logo,
        client_rep_name, client_rep_designation, client_rep_phone, client_rep_email,
        contractor_name, contractor_logo,
        submission_date, completion_date, version,
        project_location, project_manager, scope_of_work,
        introduction, scope_content, execution_details, testing_details, conclusion,
        photos, signatures, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, reportNumber, title || null, subtitle || null,
        clientName || null, clientCompany || null, clientFormerName || null, clientLogo || null,
        clientRepName || null, clientRepDesignation || null, clientRepPhone || null, clientRepEmail || null,
        contractorName || null, contractorLogo || null,
        submissionDate || null, completionDate || null, version || null,
        projectLocation || null, projectManager || null, scopeOfWork || null,
        introduction || null, scopeContent || null,
        executionDetails ? JSON.stringify(executionDetails) : null,
        testingDetails || null,
        conclusion || null,
        photos ? JSON.stringify(photos) : '[]',
        signatures ? JSON.stringify(signatures) : '[]',
        status || 'draft',
        req.user.id,
      ]
    );

    const report = await get(`SELECT * FROM ${REPORT_TABLE} WHERE id = ?`, [id]);
    res.status(201).json({ message: 'Project completion report created successfully', report: serializeReport(report) });
  } catch (error) {
    console.error('Create project completion report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update report
router.put('/:id', authenticateToken, requirePermission('project_completion_reports', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get(`SELECT id FROM ${REPORT_TABLE} WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const {
      title,
      subtitle,
      clientName,
      clientCompany,
      clientFormerName,
      clientLogo,
      clientRepName,
      clientRepDesignation,
      clientRepPhone,
      clientRepEmail,
      contractorName,
      contractorLogo,
      submissionDate,
      completionDate,
      version,
      projectLocation,
      projectManager,
      scopeOfWork,
      introduction,
      scopeContent,
      executionDetails,
      testingDetails,
      conclusion,
      photos,
      signatures,
      status,
    } = req.body;

    await run(
      `UPDATE ${REPORT_TABLE} SET
        title = ?, subtitle = ?,
        client_name = ?, client_company = ?, client_former_name = ?, client_logo = ?,
        client_rep_name = ?, client_rep_designation = ?, client_rep_phone = ?, client_rep_email = ?,
        contractor_name = ?, contractor_logo = ?,
        submission_date = ?, completion_date = ?, version = ?,
        project_location = ?, project_manager = ?, scope_of_work = ?,
        introduction = ?, scope_content = ?, execution_details = ?, testing_details = ?, conclusion = ?,
        photos = ?, signatures = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title ?? existing.title, subtitle ?? existing.subtitle,
        clientName ?? existing.client_name, clientCompany ?? existing.client_company,
        clientFormerName ?? existing.client_former_name, clientLogo ?? existing.client_logo,
        clientRepName ?? existing.client_rep_name, clientRepDesignation ?? existing.client_rep_designation,
        clientRepPhone ?? existing.client_rep_phone, clientRepEmail ?? existing.client_rep_email,
        contractorName ?? existing.contractor_name, contractorLogo ?? existing.contractor_logo,
        submissionDate ?? existing.submission_date, completionDate ?? existing.completion_date, version ?? existing.version,
        projectLocation ?? existing.project_location, projectManager ?? existing.project_manager,
        scopeOfWork ?? existing.scope_of_work,
        introduction ?? existing.introduction, scopeContent ?? existing.scope_content,
        executionDetails !== undefined ? JSON.stringify(executionDetails) : existing.execution_details,
        testingDetails ?? existing.testing_details,
        conclusion ?? existing.conclusion,
        photos !== undefined ? JSON.stringify(photos) : existing.photos,
        signatures !== undefined ? JSON.stringify(signatures) : existing.signatures,
        status ?? existing.status,
        id,
      ]
    );

    const report = await get(`SELECT * FROM ${REPORT_TABLE} WHERE id = ?`, [id]);
    res.json({ message: 'Project completion report updated successfully', report: serializeReport(report) });
  } catch (error) {
    console.error('Update project completion report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete report
router.delete('/:id', authenticateToken, requirePermission('project_completion_reports', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    await run(`DELETE FROM ${REPORT_TABLE} WHERE id = ?`, [id]);
    res.json({ message: 'Project completion report deleted successfully' });
  } catch (error) {
    console.error('Delete project completion report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
