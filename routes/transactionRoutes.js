// src/routes/transactionRoutes.js

import express from 'express';
import { getAllTransactions, getTransactionById, createTransaction } from '../controllers/transactionController.js';

const router = express.Router();

// Base path: /api/db/transactions

router.get('/', getAllTransactions); // GET /api/db/transactions (supports ?userId, ?type, ?status)
router.get('/:transactionId', getTransactionById); // GET /api/db/transactions/:transactionId
router.post('/', createTransaction); // POST /api/db/transactions

export default router;