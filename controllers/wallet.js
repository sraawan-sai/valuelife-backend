import express from 'express';
import mongoose from 'mongoose'; // Import mongoose to use ObjectId
import { WalletModel, TransactionModel } from '../models/Schema.js';

export const getUserWallet = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if userId is an ObjectId, and convert it only if necessary
        let query = { userId };
        if (mongoose.Types.ObjectId.isValid(userId)) {
            // Convert userId to ObjectId if it's a valid ObjectId string
            query = { userId: mongoose.Types.ObjectId(userId) };
        }

        // Find wallet for the user
        let wallet = await WalletModel.findOne(query);

        if (!wallet) {
            console.log('Wallet not found, creating new wallet for userId:', userId);
            wallet = new WalletModel({
                userId: mongoose.Types.ObjectId(userId), // ensure ObjectId if needed
                balance: 0
            });
            await wallet.save();
            console.log('New wallet created:', wallet);
        }

        res.status(200).json({
            success: true,
            data: {
                userId: wallet.userId,
                balance: wallet.balance
            }
        });
        
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}
