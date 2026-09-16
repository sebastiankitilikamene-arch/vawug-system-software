const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const memberRoutes = require('./members');
const loanRoutes = require('./loans');
const repaymentRoutes = require('./repayments');
const savingsRoutes = require('./savings');
const reportRoutes = require('./reports');
const userRoutes = require('./users');

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/loans', loanRoutes);
router.use('/repayments', repaymentRoutes);
router.use('/savings', savingsRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

module.exports = router;
