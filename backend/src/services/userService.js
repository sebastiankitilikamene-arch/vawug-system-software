const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userService = {
  async getAllUsers() {
    try {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role_id, department, is_active, last_login FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getUserById(id) {
    try {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role_id, department, is_active, last_login FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async createUser(data) {
    try {
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(data.password || 'Password123!', 10);

      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, role_id, department, is_active`,
        [userId, data.email, hashedPassword, data.first_name, data.last_name, data.role_id, data.department, true]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async updateUser(id, data) {
    try {
      const allowedFields = ['first_name', 'last_name', 'department', 'role_id'];
      const updates = {};

      for (const field of allowedFields) {
        if (data[field]) {
          updates[field] = data[field];
        }
      }

      const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      const result = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}
         RETURNING id, email, first_name, last_name, role_id, department, is_active`,
        values
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async deactivateUser(id) {
    try {
      const result = await pool.query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, email, is_active',
        [id]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;
