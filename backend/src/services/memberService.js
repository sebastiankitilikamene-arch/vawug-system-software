const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const memberService = {
  async getAllMembers(query = {}) {
    try {
      let sql = 'SELECT * FROM members WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (query.status) {
        sql += ` AND status = $${paramCount}`;
        params.push(query.status);
        paramCount++;
      }

      if (query.search) {
        sql += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${query.search}%`);
        paramCount++;
      }

      sql += ' ORDER BY created_at DESC LIMIT 100';

      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getMemberById(id) {
    try {
      const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async createMember(data, userId) {
    try {
      const memberId = uuidv4();
      const memberNumber = `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const result = await pool.query(
        `INSERT INTO members (
          id, member_number, email, phone, first_name, last_name, 
          date_of_birth, national_id, gender, marital_status, 
          employment_status, employer_name, salary, address_street, 
          address_city, address_state, address_postal_code, country, status, join_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          memberId, memberNumber, data.email, data.phone, data.first_name, data.last_name,
          data.date_of_birth, data.national_id, data.gender, data.marital_status,
          data.employment_status, data.employer_name, data.salary, data.address_street,
          data.address_city, data.address_state, data.address_postal_code, data.country, 'active', new Date()
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async updateMember(id, data) {
    try {
      const updates = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(data);
      values.push(id);

      const result = await pool.query(
        `UPDATE members SET ${updates}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async verifyKYC(id, userId) {
    try {
      const result = await pool.query(
        `UPDATE members SET kyc_verified = true, kyc_verified_at = NOW(), kyc_verified_by = $2, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = memberService;
