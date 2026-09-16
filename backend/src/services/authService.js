const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const authService = {
  async login(email, password) {
    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, role_id FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return { error: 'Invalid credentials' };
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return { error: 'Invalid credentials' };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role_id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Update last login
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      return {
        token,
        user: { id: user.id, email: user.email }
      };
    } catch (error) {
      throw error;
    }
  },

  async register(email, password) {
    try {
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        return { error: 'Email already registered' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await pool.query(
        'INSERT INTO users (id, email, password_hash, role_id, is_active) VALUES ($1, $2, $3, $4, $5)',
        [userId, email, hashedPassword, 'member', true]
      );

      const token = jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      return {
        token,
        user: { id: userId, email }
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = authService;
