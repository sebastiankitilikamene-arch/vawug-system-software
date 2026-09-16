const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all users
router.get('/', authMiddleware, authorize(['admin']), async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Create user
router.post('/', authMiddleware, authorize(['admin']), async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

// Update user
router.put('/:id', authMiddleware, authorize(['admin']), async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
});

// Deactivate user
router.post('/:id/deactivate', authMiddleware, authorize(['admin']), async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.json(user);
});

module.exports = router;
