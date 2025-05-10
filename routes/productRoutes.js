// src/routes/productRoutes.js

import express from 'express';
import { getAllProducts, getProductById, getProductByPaymentId, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

// Base path: /api/db/products

router.get('/', getAllProducts); // GET /api/db/products
router.get('/:id', getProductById); // GET /api/db/products/:id
router.get('/payment/:paymentId', getProductByPaymentId); // GET /api/db/products/payment/:paymentId
router.post('/', createProduct); // POST /api/db/products
router.put('/:id', updateProduct); // PUT /api/db/products/:id
router.delete('/:id', deleteProduct); // DELETE /api/db/products/:id

export default router;