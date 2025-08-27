import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get all projects (for teachers: their projects, for students: projects they're members of)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let result;
    
    if (req.user.role === 'teacher') {
      result = await pool.query(`
        SELECT p.*, 
               u.first_name as teacher_first_name, 
               u.last_name as teacher_last_name,
               COUNT(pm.student_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.teacher_id = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.teacher_id = $1
        GROUP BY p.id, u.first_name, u.last_name
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    } else {
      result = await pool.query(`
        SELECT p.*, 
               u.first_name as teacher_first_name, 
               u.last_name as teacher_last_name,
               COUNT(pm2.student_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.teacher_id = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.student_id = $1
        LEFT JOIN project_members pm2 ON p.id = pm2.project_id
        WHERE pm.student_id = $1
        GROUP BY p.id, u.first_name, u.last_name
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    }

    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project (teachers only)
router.post('/', [
  authenticateToken,
  requireRole(['teacher']),
  body('title').notEmpty().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    const result = await pool.query(
      'INSERT INTO projects (title, description, teacher_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.user.id]
    );

    res.status(201).json({ 
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this project
    let accessQuery;
    if (req.user.role === 'teacher') {
      accessQuery = 'WHERE p.id = $1 AND p.teacher_id = $2';
    } else {
      accessQuery = 'WHERE p.id = $1 AND pm.student_id = $2';
    }

    const result = await pool.query(`
      SELECT p.*, 
             u.first_name as teacher_first_name, 
             u.last_name as teacher_last_name
      FROM projects p
      LEFT JOIN users u ON p.teacher_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      ${accessQuery}
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project members
    const membersResult = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.student_id
      FROM project_members pm
      JOIN users u ON pm.student_id = u.id
      WHERE pm.project_id = $1
    `, [id]);

    const project = result.rows[0];
    project.members = membersResult.rows;

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (teachers only)
router.put('/:id', [
  authenticateToken,
  requireRole(['teacher']),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, status } = req.body;

    // Check if project belongs to teacher
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ 
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add student to project (teachers only)
router.post('/:id/members', [
  authenticateToken,
  requireRole(['teacher']),
  body('student_id').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { student_id } = req.body;

    // Check if project belongs to teacher
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if student exists
    const studentCheck = await pool.query(
      'SELECT id FROM users WHERE student_id = $1 AND role = $2',
      [student_id, 'student']
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Add student to project
    await pool.query(
      'INSERT INTO project_members (project_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, studentCheck.rows[0].id]
    );

    res.json({ message: 'Student added to project successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove student from project (teachers only)
router.delete('/:id/members/:studentId', [
  authenticateToken,
  requireRole(['teacher'])
], async (req, res) => {
  try {
    const { id, studentId } = req.params;

    // Check if project belongs to teacher
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND student_id = $2',
      [id, studentId]
    );

    res.json({ message: 'Student removed from project successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
