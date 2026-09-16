const express = require('express');
const axios = require('axios');
const router = express.Router();

// Forward to Loan Service
const LOAN_SERVICE_URL = process.env.LOAN_SERVICE_URL || 'http://localhost:3002';

// Create Loan Application
router.post('/', async (req, res) => {
  try {
    const response = await axios.post(`${LOAN_SERVICE_URL}/loans`, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Get Loan Details
router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(`${LOAN_SERVICE_URL}/loans/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Approve Loan
router.put('/:id/approve', async (req, res) => {
  try {
    const response = await axios.put(`${LOAN_SERVICE_URL}/loans/${req.params.id}/approve`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Disburse Loan
router.put('/:id/disburse', async (req, res) => {
  try {
    const response = await axios.put(`${LOAN_SERVICE_URL}/loans/${req.params.id}/disburse`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// List Loans
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${LOAN_SERVICE_URL}/loans`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = router;
