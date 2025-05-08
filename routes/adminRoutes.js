// src/routes/adminRoutes.js

import express from 'express';
import { validateAdminCredentials, updateAdminCredentials, getAdminStats, clearDatabase } from '../controllers/adminController.js';

const router = express.Router();

// Base path: /api/db

router.post('/admin/login', validateAdminCredentials); // POST /api/db/admin/login
router.put('/admin/credentials', updateAdminCredentials); // PUT /api/db/admin/credentials
router.get('/admin/stats', getAdminStats); // GET /api/db/admin/stats
router.post('/clear', clearDatabase); // POST /api/db/clear (Dangerous! Use only for dev/testing)

export default router;