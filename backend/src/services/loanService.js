const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');

const loanService = {
  async getAllLoans(query = {}) {
    try {
      let sql = 'SELECT * FROM loans WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (query.status) {
        sql += ` AND status = $${paramCount}`;
        params.push(query.status);
        paramCount++;
      }

      if (query.member_id) {
        sql += ` AND member_id = $${paramCount}`;
        params.push(query.member_id);
        paramCount++;
      }

      sql += ' ORDER BY application_date DESC LIMIT 100';

      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  async getLoanById(id) {
    try {
      const result = await pool.query('SELECT * FROM loans WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async createLoanApplication(data, userId) {
    try {
      const loanId = uuidv4();
      const loanNumber = `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const result = await pool.query(
        `INSERT INTO loans (
          id, member_id, loan_number, loan_type, amount, interest_rate, 
          interest_type, tenure_months, application_date, status, applied_by, outstanding_balance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          loanId, data.member_id, loanNumber, data.loan_type, data.amount, data.interest_rate,
          data.interest_type || 'simple', data.tenure_months, new Date(), 'submitted', userId, data.amount
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async approveLoan(id, userId) {
    try {
      const loan = await this.getLoanById(id);
      if (!loan) throw new Error('Loan not found');

      const result = await pool.query(
        `UPDATE loans SET status = 'approved', approved_by = $2, approval_date = NOW(), updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async rejectLoan(id, userId, reason) {
    try {
      const result = await pool.query(
        `UPDATE loans SET status = 'rejected', approved_by = $2, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async disburseLoan(id, amount, userId) {
    try {
      const loan = await this.getLoanById(id);
      if (!loan) throw new Error('Loan not found');
      if (loan.status !== 'approved') throw new Error('Loan not approved');

      const disburseAmount = amount || loan.amount;
      const newDisbursed = new Decimal(loan.disbursed_amount || 0).plus(disburseAmount).toString();

      const result = await pool.query(
        `UPDATE loans SET 
          status = 'active',
          disbursed_amount = $2, 
          outstanding_balance = $2,
          disbursement_date = NOW(),
          updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, newDisbursed]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async calculateRepaymentSchedule(loanId) {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) throw new Error('Loan not found');

      const principal = new Decimal(loan.amount);
      const monthlyRate = new Decimal(loan.interest_rate).dividedBy(100).dividedBy(12);
      const months = loan.tenure_months;

      // Calculate monthly payment using standard amortization formula
      const numerator = monthlyRate.times(principal).times(
        monthlyRate.plus(1).pow(months)
      );
      const denominator = monthlyRate.plus(1).pow(months).minus(1);
      const monthlyPayment = numerator.dividedBy(denominator);

      // Generate schedule
      const schedule = [];
      let balance = principal;
      let date = new Date(loan.application_date);

      for (let i = 1; i <= months; i++) {
        date.setMonth(date.getMonth() + 1);
        const interestPayment = balance.times(monthlyRate);
        const principalPayment = monthlyPayment.minus(interestPayment);
        balance = balance.minus(principalPayment);

        schedule.push({
          payment_number: i,
          scheduled_date: new Date(date),
          principal: principalPayment.toFixed(2),
          interest: interestPayment.toFixed(2),
          total_payment: monthlyPayment.toFixed(2),
          balance: Math.max(0, balance.toFixed(2))
        });
      }

      return schedule;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = loanService;
