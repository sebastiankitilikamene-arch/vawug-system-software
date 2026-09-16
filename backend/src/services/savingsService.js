const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');

const savingsService = {
  async getMemberSavings(memberId) {
    try {
      const result = await pool.query(
        'SELECT * FROM savings WHERE member_id = $1',
        [memberId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async createSavingsAccount(data, userId) {
    try {
      const savingsId = uuidv4();
      const accountNumber = `SAV-${Date.now()}`;

      const result = await pool.query(
        `INSERT INTO savings (
          id, member_id, account_number, account_type, status, opened_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [savingsId, data.member_id, accountNumber, data.account_type || 'savings', 'active', new Date()]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async depositToSavings(savingsId, amount, userId) {
    try {
      const savings = await pool.query('SELECT * FROM savings WHERE id = $1', [savingsId]);
      if (savings.rows.length === 0) throw new Error('Savings account not found');

      const newBalance = new Decimal(savings.rows[0].balance).plus(amount);

      // Update savings account
      await pool.query(
        'UPDATE savings SET balance = $2, updated_at = NOW() WHERE id = $1',
        [savingsId, newBalance.toString()]
      );

      // Record transaction
      const transactionId = uuidv4();
      const result = await pool.query(
        `INSERT INTO transactions (
          id, transaction_type, member_id, to_account_id, amount, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [transactionId, 'deposit', savings.rows[0].member_id, savingsId, amount, 'completed', userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async withdrawFromSavings(savingsId, amount, userId) {
    try {
      const savings = await pool.query('SELECT * FROM savings WHERE id = $1', [savingsId]);
      if (savings.rows.length === 0) throw new Error('Savings account not found');

      const currentBalance = new Decimal(savings.rows[0].balance);
      const withdrawAmount = new Decimal(amount);

      if (currentBalance.lessThan(withdrawAmount)) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance.minus(withdrawAmount);

      // Update savings account
      await pool.query(
        'UPDATE savings SET balance = $2, updated_at = NOW() WHERE id = $1',
        [savingsId, newBalance.toString()]
      );

      // Record transaction
      const transactionId = uuidv4();
      const result = await pool.query(
        `INSERT INTO transactions (
          id, transaction_type, member_id, from_account_id, amount, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [transactionId, 'withdrawal', savings.rows[0].member_id, savingsId, amount, 'completed', userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = savingsService;
