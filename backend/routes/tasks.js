const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get tasks for a project
router.get('/project/:projectId', requireProjectRole(null), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        u1.name as assignee_name, u1.avatar_color as assignee_color,
        u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.project_id = $1
      ORDER BY
        CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.created_at DESC
    `, [req.params.projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats for current user
router.get('/dashboard', async (req, res) => {
  try {
    const assigned = await pool.query(`
      SELECT t.*, p.name as project_name,
        u.name as assignee_name, u.avatar_color as assignee_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.assignee_id = $1 AND t.status != 'done'
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
      LIMIT 20
    `, [req.user.id]);

    const overdue = await pool.query(`
      SELECT COUNT(*) as count FROM tasks
      WHERE assignee_id = $1 AND status != 'done' AND due_date < CURRENT_DATE
    `, [req.user.id]);

    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count FROM tasks
      WHERE assignee_id = $1 GROUP BY status
    `, [req.user.id]);

    res.json({
      tasks: assigned.rows,
      overdue_count: parseInt(overdue.rows[0].count),
      by_status: byStatus.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('project_id').isInt().withMessage('Project ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('due_date').optional({ nullable: true }).isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, project_id, assignee_id, priority, status, due_date } = req.body;

  // Check membership
  const memberCheck = await pool.query(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [project_id, req.user.id]
  );
  const ownerCheck = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [project_id]);
  if (memberCheck.rows.length === 0 && ownerCheck.rows[0]?.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Not a project member' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, status, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description || '', project_id, assignee_id || null, req.user.id, priority || 'medium', status || 'todo', due_date || null]);

    const task = result.rows[0];
    // Fetch with join
    const full = await pool.query(`
      SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [task.id]);

    res.status(201).json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:taskId', async (req, res) => {
  try {
    // Check access
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const { title, description, assignee_id, priority, status, due_date } = req.body;
    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assignee_id = CASE WHEN $3::int IS NOT NULL THEN $3::int ELSE assignee_id END,
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        due_date = COALESCE($6, due_date),
        updated_at = NOW()
      WHERE id = $7 RETURNING *
    `, [title, description, assignee_id, priority, status, due_date, req.params.taskId]);

    const full = await pool.query(`
      SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [result.rows[0].id]);

    res.json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (task.rows[0].created_by !== req.user.id) return res.status(403).json({ error: 'Only creator can delete' });
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
