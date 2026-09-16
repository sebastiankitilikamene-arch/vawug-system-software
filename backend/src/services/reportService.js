const pool = require('../config/database');

const reportService = {
  async getPortfolioSummary() {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(DISTINCT l.id) as total_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'defaulted' THEN l.id END) as defaulted_loans,
          COUNT(DISTINCT m.id) as total_members,
          COUNT(DISTINCT CASE WHEN m.kyc_verified THEN m.id END) as verified_members,
          COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.outstanding_balance ELSE 0 END), 0) as total_outstanding,
          COALESCE(SUM(l.amount), 0) as total_disbursed,
          COALESCE(SUM(r.paid_amount), 0) as total_repaid
        FROM loans l
        FULL OUTER JOIN members m ON 1=1
        LEFT JOIN repayments r ON l.id = r.loan_id
      `);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async getMemberReport(memberId) {
    try {
      const result = await pool.query(`
        SELECT
          m.*,
          COUNT(l.id) as total_loans,
          COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_loans,
          COUNT(CASE WHEN l.status = 'defaulted' THEN 1 END) as defaulted_loans,
          COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.outstanding_balance ELSE 0 END), 0) as outstanding_balance,
          COALESCE(SUM(s.balance), 0) as total_savings
        FROM members m
        LEFT JOIN loans l ON m.id = l.member_id
        LEFT JOIN savings s ON m.id = s.member_id
        WHERE m.id = $1
        GROUP BY m.id
      `, [memberId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async getDefaultRates() {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(CASE WHEN l.is_defaulted THEN 1 END)::float / COUNT(l.id) * 100 as default_rate_percentage,
          COUNT(CASE WHEN l.is_defaulted THEN 1 END) as defaulted_count,
          COUNT(l.id) as total_active_loans,
          AVG(DATEDIFF(day, l.maturity_date, NOW()))::int as avg_days_overdue
        FROM loans l
        WHERE l.status IN ('active', 'defaulted')
      `);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  async getRevenueAnalysis(period = 'monthly') {
    try {
      let dateFormat = 'YYYY-MM';
      if (period === 'daily') dateFormat = 'YYYY-MM-DD';
      if (period === 'annual') dateFormat = 'YYYY';

      const result = await pool.query(`
        SELECT
          DATE_TRUNC('month', r.payment_date)::date as period,
          COALESCE(SUM(r.interest_paid), 0) as interest_revenue,
          COALESCE(SUM(r.penalty_paid), 0) as penalty_revenue,
          COALESCE(SUM(r.paid_amount), 0) as total_collected
        FROM repayments r
        WHERE r.status = 'paid' AND r.payment_date IS NOT NULL
        GROUP BY DATE_TRUNC('month', r.payment_date)
        ORDER BY period DESC
        LIMIT 12
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = reportService;
