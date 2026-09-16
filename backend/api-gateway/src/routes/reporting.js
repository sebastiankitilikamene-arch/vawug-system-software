const express = require('express');
const axios = require('axios');
const router = express.Router();

// Forward to Reporting Service
const REPORTING_SERVICE_URL = process.env.REPORTING_SERVICE_URL || 'http://localhost:3005';

// Get Dashboard Data
router.get('/dashboards/:id', async (req, res) => {
  try {
    const response = await axios.get(`${REPORTING_SERVICE_URL}/dashboards/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Generate Report
router.get('/:type', async (req, res) => {
  try {
    const response = await axios.get(`${REPORTING_SERVICE_URL}/reports/${req.params.type}`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Schedule Report Generation
router.post('/schedule', async (req, res) => {
  try {
    const response = await axios.post(`${REPORTING_SERVICE_URL}/reports/schedule`, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = router;
