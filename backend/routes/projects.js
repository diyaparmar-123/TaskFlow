const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all projects for current user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        pm.role as my_role
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Project name required'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', req.user.id]
    );
    // Add owner as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.user.id, 'admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:projectId', requireProjectRole(null), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name
      FROM projects p JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [req.params.projectId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project (admin only)
router.put('/:projectId', requireProjectRole(['admin']), [
  body('name').optional().trim().isLength({ min: 1, max: 150 }),
  body('status').optional().isIn(['active', 'archived', 'completed'])
], async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status) WHERE id = $4 RETURNING *',
      [name, description, status, req.params.projectId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:projectId', requireProjectRole(['admin']), async (req, res) => {
  try {
    // Only owner can delete
    const project = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.projectId]);
    if (project.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project members
router.get('/:projectId/members', requireProjectRole(null), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 ORDER BY pm.joined_at ASC
    `, [req.params.projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite member by email (admin only)
router.post('/:projectId/members', requireProjectRole(['admin']), [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role } = req.body;
  try {
    const userResult = await pool.query('SELECT id, name, email, avatar_color FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found. They must sign up first.' });

    const user = userResult.rows[0];
    const existing = await pool.query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, user.id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'User already in project' });

    await pool.query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)', [req.params.projectId, user.id, role]);
    res.status(201).json({ message: 'Member added', user, role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member role (admin only)
router.put('/:projectId/members/:userId', requireProjectRole(['admin']), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    await pool.query('UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3', [role, req.params.projectId, req.params.userId]);
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member (admin only)
router.delete('/:projectId/members/:userId', requireProjectRole(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
