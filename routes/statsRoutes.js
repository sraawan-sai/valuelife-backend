// src/routes/statsRoutes.js

import express from 'express';
import {
    getNetworkStats, updateNetworkStats,
    getDashboardStats, updateDashboardStats
} from '../controllers/statsController.js'; // Assuming you create a statsController.js

const router = express.Router();

// Base path: /api/db/stats

// Network Stats
router.get('/network/:identifier', getNetworkStats); // GET /api/db/stats/network/:identifier
router.put('/network/:identifier', updateNetworkStats); // PUT /api/db/stats/network/:identifier

// Dashboard Stats
router.get('/dashboard/:identifier', getDashboardStats); // GET /api/db/stats/dashboard/:identifier
router.put('/dashboard/:identifier', updateDashboardStats); // PUT /api/db/stats/dashboard/:identifier


export default router;