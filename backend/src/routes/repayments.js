const express = require('express');
const router = express.Router();
const repaymentService = require('../services/repaymentService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get repayments for loan
router.get('/loan/:loanId', authMiddleware, async (req, res) => {
  const repayments = await repaymentService.getRepaymentsByLoan(req.params.loanId);
  res.json(repayments);
});

// Get all overdue payments
router.get('/status/overdue', authMiddleware, async (req, res) => {
  const overdue = await repaymentService.getOverdueRepayments();
  res.json(overdue);
});

// Record payment
router.post('/', authMiddleware, authorize(['finance', 'admin']), async (req, res) => {
  const repayment = await repaymentService.recordPayment(req.body, req.user.id);
  res.status(201).json(repayment);
});

// Send reminder
router.post('/:id/send-reminder', authMiddleware, async (req, res) => {
  const result = await repaymentService.sendReminder(req.params.id);
  res.json(result);
});

module.exports = router;
