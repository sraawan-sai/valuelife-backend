// src/routes/userRoutes.js

import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

// Base path: /api/db/users

router.get('/', getAllUsers); // GET /api/db/users
router.get('/:userId', getUserById); // GET /api/db/users/:userId
router.post('/', createUser); // POST /api/db/users
router.put('/:userId', updateUser); // PUT /api/db/users/:userId
router.delete('/:userId', deleteUser); // DELETE /api/db/users/:userId

export default router;