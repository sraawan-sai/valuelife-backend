// src/routes/walletRoutes.js

import express from 'express';
import { Router } from 'express';
import { getUserWallet } from '../controllers/wallet.js';

const router = Router();

// Base path: /api/db/wallet

router.get("/:userId", getUserWallet) // GET /api/db/wallet (get wallets, supports ?userId)
router.put("/:userId", updateUserWallet); // This route will handle the update for wallet


export default router;