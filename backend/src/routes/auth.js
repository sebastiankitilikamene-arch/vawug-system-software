const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

router.post('/login', validateRequest(loginSchema), async (req, res) => {
  const result = await authService.login(req.validated.email, req.validated.password);
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

router.post('/register', validateRequest(loginSchema), async (req, res) => {
  const result = await authService.register(req.validated.email, req.validated.password);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result);
});

module.exports = router;
