// src/routes/settingsRoutes.js

import express from 'express';
import { getCommissionStructure, updateCommissionStructure /*, getCurrentUserSetting, updateCurrentUserSetting */ } from '../controllers/settingsController.js';

const router = express.Router();

// Base path: /api/db

router.get('/commissionStructure', getCommissionStructure); // GET /api/db/commissionStructure
router.put('/commissionStructure', updateCommissionStructure); // PUT /api/db/commissionStructure

// If using a setting document for currentUser (optional)
// import { getCurrentUserSetting, updateCurrentUserSetting } from '../controllers/userController.js'; // assuming moved to userController
// router.get('/currentUser', getCurrentUserSetting); // GET /api/db/currentUser
// router.put('/currentUser', updateCurrentUserSetting); // PUT /api/db/currentUser

export default router;