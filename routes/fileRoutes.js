// src/routes/fileRoutes.js

import express from 'express';
import { getAllFiles, getFileById, createFile, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

// Base path: /api/db/files

router.get('/', getAllFiles); // GET /api/db/files (supports ?userId, ?storageKey)
router.get('/:fileId', getFileById); // GET /api/db/files/:fileId
router.post('/', createFile); // POST /api/db/files
router.delete('/:fileId', deleteFile); // DELETE /api/db/files/:fileId

export default router;