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
            // Use 'new' keyword to properly instantiate ObjectId
            query = { userId: new mongoose.Types.ObjectId(userId) };
        }

        // Find wallet for the user
        let wallet = await WalletModel.findOne(query);

        if (!wallet) {
            console.log('Wallet not found, creating new wallet for userId:', userId);
            wallet = new WalletModel({
                userId: new mongoose.Types.ObjectId(userId), // ensure ObjectId if needed
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
export const updateUserWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { balance, transactions } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const objectId = new mongoose.Types.ObjectId(userId);

        // Find the wallet by userId
        let wallet = await WalletModel.findOne({ userId: objectId });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Update wallet fields (balance and transactions)
        wallet.balance = balance || wallet.balance;
        wallet.transactions = transactions || wallet.transactions;

        // Save the updated wallet
        await wallet.save();

        res.status(200).json({
            success: true,
            message: 'Wallet updated successfully',
            data: wallet
        });
        
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
