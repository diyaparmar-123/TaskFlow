const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, avatar_color FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireProjectRole = (allowedRoles) => async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (result.rows.length === 0) {
      // Check if user is project owner
      const ownerCheck = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
      if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      if (ownerCheck.rows[0].owner_id !== userId) return res.status(403).json({ error: 'Access denied' });
      req.projectRole = 'admin';
      return next();
    }
    const role = result.rows[0].role;
    if (allowedRoles && !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.projectRole = role;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { authenticate, requireProjectRole };
