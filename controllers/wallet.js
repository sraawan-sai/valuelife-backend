import express from 'express';
import { WalletModel, TransactionModel } from '../models/Schema.js';

export const getUserWallet = async (req, res) => {
    try {
        const {userId} = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find wallet for the user
        let wallet = await WalletModel.findOne({ userId });

        if (!wallet) {
            console.log('Wallet not found, creating new wallet for userId:', userId);
            wallet = new WalletModel({
                userId,
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