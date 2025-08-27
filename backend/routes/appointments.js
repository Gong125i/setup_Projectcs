import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get appointments (filtered by user role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, project_id, date } = req.query;
    let query = '';
    let params = [];
    let paramCount = 1;

    if (req.user.role === 'teacher') {
      query = `
        SELECT a.*, 
               p.title as project_title,
               s.first_name as student_first_name, 
               s.last_name as student_last_name,
               s.student_id as student_student_id
        FROM appointments a
        LEFT JOIN projects p ON a.project_id = p.id
        LEFT JOIN users s ON a.student_id = s.id
        WHERE a.teacher_id = $${paramCount++}
      `;
      params.push(req.user.id);
    } else {
      query = `
        SELECT a.*, 
               p.title as project_title,
               t.first_name as teacher_first_name, 
               t.last_name as teacher_last_name,
               t.teacher_id as teacher_teacher_id
        FROM appointments a
        LEFT JOIN projects p ON a.project_id = p.id
        LEFT JOIN users t ON a.teacher_id = t.id
        WHERE a.student_id = $${paramCount++}
      `;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND a.status = $${paramCount++}`;
      params.push(status);
    }

    if (project_id) {
      query += ` AND a.project_id = $${paramCount++}`;
      params.push(project_id);
    }

    if (date) {
      query += ` AND a.appointment_date = $${paramCount++}`;
      params.push(date);
    }

    query += ' ORDER BY a.appointment_date DESC, a.start_time ASC';

    const result = await pool.query(query, params);
    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create appointment (students only)
router.post('/', [
  authenticateToken,
  requireRole(['student']),
  body('project_id').isInt(),
  body('teacher_id').isInt(),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('appointment_date').isDate(),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project_id, teacher_id, title, description, appointment_date, start_time, end_time, location } = req.body;

    // Check if student is member of the project
    const projectCheck = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND student_id = $2',
      [project_id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    // Check if teacher exists and is the project teacher
    const teacherCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND teacher_id = $2',
      [project_id, teacher_id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid teacher for this project' });
    }

    // Check for time conflicts
    const conflictCheck = await pool.query(`
      SELECT id FROM appointments 
      WHERE teacher_id = $1 
      AND appointment_date = $2 
      AND status IN ('pending', 'confirmed')
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `, [teacher_id, appointment_date, start_time, end_time]);

    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Time slot conflicts with existing appointment' });
    }

    const result = await pool.query(
      `INSERT INTO appointments (project_id, student_id, teacher_id, title, description, appointment_date, start_time, end_time, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [project_id, req.user.id, teacher_id, title, description, appointment_date, start_time, end_time, location]
    );

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    let params;

    if (req.user.role === 'teacher') {
      query = `
        SELECT a.*, 
               p.title as project_title,
               s.first_name as student_first_name, 
               s.last_name as student_last_name,
               s.student_id as student_student_id
        FROM appointments a
        LEFT JOIN projects p ON a.project_id = p.id
        LEFT JOIN users s ON a.student_id = s.id
        WHERE a.id = $1 AND a.teacher_id = $2
      `;
      params = [id, req.user.id];
    } else {
      query = `
        SELECT a.*, 
               p.title as project_title,
               t.first_name as teacher_first_name, 
               t.last_name as teacher_last_name,
               t.teacher_id as teacher_teacher_id
        FROM appointments a
        LEFT JOIN projects p ON a.project_id = p.id
        LEFT JOIN users t ON a.teacher_id = t.id
        WHERE a.id = $1 AND a.student_id = $2
      `;
      params = [id, req.user.id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Get appointment notes
    const notesResult = await pool.query(`
      SELECT an.*, u.first_name, u.last_name, u.role
      FROM appointment_notes an
      JOIN users u ON an.user_id = u.id
      WHERE an.appointment_id = $1
      ORDER BY an.created_at ASC
    `, [id]);

    const appointment = result.rows[0];
    appointment.notes = notesResult.rows;

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status (teachers can confirm/reject, students can cancel)
router.patch('/:id/status', [
  authenticateToken,
  body('status').isIn(['confirmed', 'rejected', 'cancelled', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if user has permission to update this appointment
    let permissionQuery;
    if (req.user.role === 'teacher') {
      permissionQuery = 'WHERE id = $1 AND teacher_id = $2';
    } else {
      permissionQuery = 'WHERE id = $1 AND student_id = $2';
    }

    const appointmentCheck = await pool.query(
      `SELECT id, status FROM appointments ${permissionQuery}`,
      [id, req.user.id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointmentCheck.rows[0];

    // Validate status transitions
    if (req.user.role === 'teacher') {
      if (!['confirmed', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status for teacher' });
      }
    } else {
      if (status !== 'cancelled') {
        return res.status(400).json({ message: 'Students can only cancel appointments' });
      }
    }

    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: 'Appointment status updated successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add note to appointment
router.post('/:id/notes', [
  authenticateToken,
  body('note').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { note } = req.body;

    // Check if user has access to this appointment
    let accessQuery;
    if (req.user.role === 'teacher') {
      accessQuery = 'WHERE id = $1 AND teacher_id = $2';
    } else {
      accessQuery = 'WHERE id = $1 AND student_id = $2';
    }

    const appointmentCheck = await pool.query(
      `SELECT id FROM appointments ${accessQuery}`,
      [id, req.user.id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await pool.query(
      'INSERT INTO appointment_notes (appointment_id, user_id, note) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, note]
    );

    res.status(201).json({
      message: 'Note added successfully',
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher schedule
router.get('/teacher/:teacherId/schedule', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date } = req.query;

    let query = `
      SELECT day_of_week, start_time, end_time, is_available
      FROM teacher_schedules
      WHERE teacher_id = $1
    `;
    let params = [teacherId];

    if (date) {
      const dayOfWeek = new Date(date).getDay();
      query += ' AND day_of_week = $2';
      params.push(dayOfWeek);
    }

    query += ' ORDER BY day_of_week, start_time';

    const result = await pool.query(query, params);
    res.json({ schedule: result.rows });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update teacher schedule (teachers only)
router.put('/teacher/schedule', [
  authenticateToken,
  requireRole(['teacher']),
  body('schedules').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { schedules } = req.body;

    // Delete existing schedules
    await pool.query('DELETE FROM teacher_schedules WHERE teacher_id = $1', [req.user.id]);

    // Insert new schedules
    for (const schedule of schedules) {
      await pool.query(
        'INSERT INTO teacher_schedules (teacher_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.is_available]
      );
    }

    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
