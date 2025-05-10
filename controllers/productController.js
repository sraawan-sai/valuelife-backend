// src/controllers/productController.js

import { ProductModel } from '../models/Schema.js'; // Ensure the path matches your project structure

// GET /api/db/products
export const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
};

// GET /api/db/products/:id
export const getProductById = async (req, res) => {
    try {
        const product = await ProductModel.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product', details: error.message });
    }
};

export const getProductByPaymentId = async (req, res) => {
    try {
        // Endpoint is /api/db/products/payment/:paymentId
        const product = await ProductModel.findOne({ razorpayPaymentId: req.params.paymentId });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found for payment ID' });
        }
    } catch (error) {
        console.error('Error getting product by payment ID:', error);
        res.status(500).json({ error: 'Failed to retrieve product by payment ID' });
    }
};

// POST /api/db/products
export const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        if (typeof productData.createdDate === 'string') {
            productData.createdDate = new Date(productData.createdDate);
        }

        const newProduct = new ProductModel(productData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
};

// PUT /api/db/products/:id
export const updateProduct = async (req, res) => {
    try {
        const updated = await ProductModel.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const deleted = await ProductModel.findOneAndDelete({ id: req.params.id });
        if (!deleted) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
};