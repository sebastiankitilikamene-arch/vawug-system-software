const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Portfolio summary
router.get('/portfolio/summary', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  const summary = await reportService.getPortfolioSummary();
  res.json(summary);
});

// Member performance report
router.get('/member/:memberId', authMiddleware, async (req, res) => {
  const report = await reportService.getMemberReport(req.params.memberId);
  res.json(report);
});

// Default rates
router.get('/analytics/default-rates', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  const rates = await reportService.getDefaultRates();
  res.json(rates);
});

// Revenue analysis
router.get('/analytics/revenue', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  const revenue = await reportService.getRevenueAnalysis(req.query.period);
  res.json(revenue);
});

module.exports = router;
