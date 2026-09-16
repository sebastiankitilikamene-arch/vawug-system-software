const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');

const repaymentService = {
  async getRepaymentsByLoan(loanId) {
    try {
      const result = await pool.query(
        'SELECT * FROM repayments WHERE loan_id = $1 ORDER BY scheduled_date ASC',
        [loanId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getOverdueRepayments() {
    try {
      const result = await pool.query(
        `SELECT r.*, m.email, m.phone, l.loan_number 
         FROM repayments r
         JOIN loans l ON r.loan_id = l.id
         JOIN members m ON l.member_id = m.id
         WHERE r.status = 'overdue' AND r.scheduled_date < NOW()
         ORDER BY r.scheduled_date ASC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async recordPayment(data, userId) {
    try {
      const repaymentId = uuidv4();
      const paymentReference = `PAY-${Date.now()}`;

      const result = await pool.query(
        `INSERT INTO repayments (
          id, loan_id, scheduled_date, due_amount, paid_amount, principal_paid,
          interest_paid, status, payment_date, payment_method, payment_reference, processed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          repaymentId, data.loan_id, data.scheduled_date, data.due_amount, data.paid_amount,
          data.principal_paid, data.interest_paid, 'paid', new Date(), data.payment_method,
          paymentReference, userId
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async sendReminder(repaymentId) {
    try {
      const repayment = await pool.query(
        `SELECT r.*, m.email, m.phone, l.loan_number
         FROM repayments r
         JOIN loans l ON r.loan_id = l.id
         JOIN members m ON l.member_id = m.id
         WHERE r.id = $1`,
        [repaymentId]
      );

      if (repayment.rows.length === 0) {
        throw new Error('Repayment not found');
      }

      const data = repayment.rows[0];

      // TODO: Implement SMS/Email notification
      console.log(`Reminder sent to ${data.email} for loan ${data.loan_number}`);

      return { success: true, message: 'Reminder sent' };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = repaymentService;
