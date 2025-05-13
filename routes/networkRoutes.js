// src/routes/networkRoutes.js

import express from 'express';
import { getNetworkNode, updateNetworkNode, getRootNetworkNode, updateRootNetworkNode } from '../controllers/networkController.js';

const router = express.Router();

// Base path: /api/db/network

router.get('/root', getRootNetworkNode); // GET /api/db/network/root
router.put('/root', updateRootNetworkNode); // PUT /api/db/network/root (update the root node)
router.get('/:userId', getNetworkNode); // GET /api/db/network/:userId (get a specific node by user ID)
router.put('/:userId', updateNetworkNode); // PUT /api/db/network/:userId (update a specific node by user ID)
// POST /networkNodes for creation is handled in UserController.createUser

export default router;