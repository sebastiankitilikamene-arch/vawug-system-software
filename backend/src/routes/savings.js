const express = require('express');
const router = express.Router();
const savingsService = require('../services/savingsService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get member savings
router.get('/member/:memberId', authMiddleware, async (req, res) => {
  const savings = await savingsService.getMemberSavings(req.params.memberId);
  res.json(savings);
});

// Create savings account
router.post('/', authMiddleware, authorize(['admin', 'officer']), async (req, res) => {
  const savings = await savingsService.createSavingsAccount(req.body, req.user.id);
  res.status(201).json(savings);
});

// Deposit to savings
router.post('/:id/deposit', authMiddleware, async (req, res) => {
  const transaction = await savingsService.depositToSavings(req.params.id, req.body.amount, req.user.id);
  res.json(transaction);
});

// Withdraw from savings
router.post('/:id/withdraw', authMiddleware, async (req, res) => {
  const transaction = await savingsService.withdrawFromSavings(req.params.id, req.body.amount, req.user.id);
  res.json(transaction);
});

module.exports = router;
