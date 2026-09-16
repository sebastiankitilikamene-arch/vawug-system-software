const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all members
router.get('/', authMiddleware, async (req, res) => {
  const members = await memberService.getAllMembers(req.query);
  res.json(members);
});

// Get member by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const member = await memberService.getMemberById(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(member);
});

// Create member
router.post('/', authMiddleware, authorize(['admin', 'officer']), async (req, res) => {
  const member = await memberService.createMember(req.body, req.user.id);
  res.status(201).json(member);
});

// Update member
router.put('/:id', authMiddleware, authorize(['admin', 'officer']), async (req, res) => {
  const member = await memberService.updateMember(req.params.id, req.body);
  res.json(member);
});

// Verify KYC
router.post('/:id/verify-kyc', authMiddleware, authorize(['admin', 'officer']), async (req, res) => {
  const member = await memberService.verifyKYC(req.params.id, req.user.id);
  res.json(member);
});

module.exports = router;
