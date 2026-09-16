const express = require('express');
const router = express.Router();
const loanService = require('../services/loanService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all loans
router.get('/', authMiddleware, async (req, res) => {
  const loans = await loanService.getAllLoans(req.query);
  res.json(loans);
});

// Get loan by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const loan = await loanService.getLoanById(req.params.id);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  res.json(loan);
});

// Create loan application
router.post('/', authMiddleware, async (req, res) => {
  const loan = await loanService.createLoanApplication(req.body, req.user.id);
  res.status(201).json(loan);
});

// Approve loan
router.post('/:id/approve', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  const loan = await loanService.approveLoan(req.params.id, req.user.id);
  res.json(loan);
});

// Reject loan
router.post('/:id/reject', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  const loan = await loanService.rejectLoan(req.params.id, req.user.id, req.body.reason);
  res.json(loan);
});

// Disburse loan
router.post('/:id/disburse', authMiddleware, authorize(['admin', 'finance']), async (req, res) => {
  const loan = await loanService.disburseLoan(req.params.id, req.body.amount, req.user.id);
  res.json(loan);
});

// Calculate repayment schedule
router.post('/:id/calculate-schedule', authMiddleware, async (req, res) => {
  const schedule = await loanService.calculateRepaymentSchedule(req.params.id);
  res.json(schedule);
});

module.exports = router;
