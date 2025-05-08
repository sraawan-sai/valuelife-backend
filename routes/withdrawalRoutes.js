// src/routes/withdrawalRoutes.js

import express from 'express';
import { getAllWithdrawalRequests, getWithdrawalRequestById, createWithdrawalRequest, updateWithdrawalRequest } from '../controllers/withdrawalController.js';

const router = express.Router();

// Base path: /api/db/withdrawalRequests

router.get('/', getAllWithdrawalRequests); // GET /api/db/withdrawalRequests (supports ?userId)
router.get('/:id', getWithdrawalRequestById); // GET /api/db/withdrawalRequests/:id
router.post('/', createWithdrawalRequest); // POST /api/db/withdrawalRequests
router.put('/:id', updateWithdrawalRequest); // PUT /api/db/withdrawalRequests/:id

export default router;