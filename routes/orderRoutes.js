// src/routes/orderRoutes.js

import express from 'express';
import { getAllOrders, getOrderById, getOrderByPaymentId, createOrder, updateOrder } from '../controllers/orderController.js';

const router = express.Router();

// Base path: /api/db/orders

router.get('/', getAllOrders); // GET /api/db/orders (supports ?userId)
router.get('/:id', getOrderById); // GET /api/db/orders/:id
router.get('/payment/:paymentId', getOrderByPaymentId); // GET /api/db/orders/payment/:paymentId
router.post('/', createOrder); // POST /api/db/orders
router.put('/:id', updateOrder); // PUT /api/db/orders/:id

export default router;