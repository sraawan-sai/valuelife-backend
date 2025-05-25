import express from 'express';
import { Router } from 'express';
import { getUserWallet, updateUserWallet } from '../controllers/wallet.js';

const router = Router();

// Base path: /api/db/wallet
router.get("/:userId", getUserWallet); // GET /api/db/wallet/:userId (fetch wallet)
router.put("/:userId", updateUserWallet); // PUT /api/db/wallet/:userId (update wallet)

export default router;
