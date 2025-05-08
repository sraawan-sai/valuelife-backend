// src/controllers/orderController.js

import { OrderModel } from '../models/Schema.js';
// You might import other services/controllers here to trigger logic on order status change
// import { recordProductPurchase } from '../services/orderProcessingService.js'; // Example

// Get all orders (optionally filter by userId)
export const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findOne({ id: req.params.id }); // Find by frontend 'id'
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
};

// Get an order by payment ID
export const getOrderByPaymentId = async (req, res) => {
  try {
    // Endpoint is /api/db/orders/payment/:paymentId
    const order = await OrderModel.findOne({ razorpayPaymentId: req.params.paymentId });
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found for payment ID' });
    }
  } catch (error) {
    console.error('Error getting order by payment ID:', error);
    res.status(500).json({ error: 'Failed to retrieve order by payment ID' });
  }
};


// Create a new order
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    if (typeof orderData.createdAt === 'string') orderData.createdAt = new Date(orderData.createdAt);
    if (typeof orderData.updatedAt === 'string') orderData.updatedAt = new Date(orderData.updatedAt);

    const newOrder = new OrderModel(orderData);
    await newOrder.save(); // Save the new order document

    res.status(201).json(newOrder); // Respond with created order document
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};

// Update an order by ID (e.g., updating status after payment)
export const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id; // Frontend 'id'
    const updateData = req.body; // e.g., { status: 'paid', razorpayPaymentId: '...' }
    if (typeof updateData.updatedAt === 'string') updateData.updatedAt = new Date(updateData.updatedAt);


    // Find the order document by its custom 'id' field and update it
    const updatedOrder = await OrderModel.findOneAndUpdate({ id: orderId }, updateData, { new: true });

    if (updatedOrder) {
      // --- Backend Logic: Trigger Product Purchase Logic if Status is 'paid' ---
      if (updatedOrder.status === 'paid') {
        // This is the crucial point where you trigger the MLM business logic
        // based on a successful payment.
        console.log(`Order ${updatedOrder.id} status updated to paid. Trigger backend purchase processing here.`);
        // In a real app, you would likely call a separate service function here:
        // try {
        //    const success = await processPaidOrder(updatedOrder); // Function that calls commission logic
        //    if (!success) {
        //        console.error('Failed to process paid order for commissions.');
        //        // Handle error - maybe log, alert admin, or revert order status?
        //    }
        // } catch (processingError) {
        //     console.error('Error during paid order processing:', processingError);
        //      // Handle error
        // }
        // Note: The frontend `recordProductPurchase` logic should be moved or replicated in the backend `processPaidOrder` function.
        // This backend function would fetch user, product, commission structure, and create transaction documents.
      }
      // --- End Backend Logic ---


      res.json(updatedOrder); // Respond with updated order document
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};