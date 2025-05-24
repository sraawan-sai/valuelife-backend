// src/routes/walletRoutes.js

import express from 'express';
import { Router } from 'express';
import { getUserWallet } from '../controllers/wallet.js';

const router = Router();

// Base path: /api/db/wallet

router.get("/:userId", getUserWallet) // GET /api/db/wallet (get wallets, supports ?userId)

export default router;