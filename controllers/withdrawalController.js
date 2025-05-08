// src/controllers/withdrawalController.js

import { WithdrawalRequestModel, TransactionModel, WalletModel, DashboardStatsModel } from '../models/Schema.js';
import mongoose from 'mongoose';


// Get all withdrawal requests (optionally filter by userId)
export const getAllWithdrawalRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    const requests = await WithdrawalRequestModel.find(filter).sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    res.status(500).json({ error: 'Failed to retrieve withdrawal requests' });
  }
};

// Get a single withdrawal request by ID
export const getWithdrawalRequestById = async (req, res) => {
  try {
    const request = await WithdrawalRequestModel.findOne({ id: req.params.id });
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({ error: 'Withdrawal request not found' });
    }
  } catch (error) {
    console.error('Error getting withdrawal request by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve withdrawal request' });
  }
};

// Create a new withdrawal request
export const createWithdrawalRequest = async (req, res) => {
  try {
    const requestData = req.body;
    if (typeof requestData.requestDate === 'string') requestData.requestDate = new Date(requestData.requestDate);

    const newRequest = new WithdrawalRequestModel(requestData);
    await newRequest.save(); // Save the new request document

    // --- Backend Logic: Update User Dashboard Stats (Add to Pending) ---
    // Find the user's dashboard stats document
    const userDashboardStats = await DashboardStatsModel.findOne({ userId: newRequest.userId });
    if (userDashboardStats) {
      // Add the requested amount to pending withdrawals stat
      await DashboardStatsModel.updateOne({ userId: newRequest.userId }, { $inc: { pendingWithdrawals: newRequest.amount } });
      console.log(`Dashboard stats pending withdrawals updated for user ${newRequest.userId} by ${newRequest.amount}.`);
    } else {
      console.warn(`DashboardStats not found for user ${newRequest.userId} to update pending withdrawals.`);
    }
    // --- End Backend Logic ---


    res.status(201).json(newRequest); // Respond with created request
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request', details: error.message });
  }
};

// Update withdrawal request by ID (Backend logic to handle status change, transactions, wallet, stats)
export const updateWithdrawalRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const updateData = req.body; // Contains status, processedDate, remarks etc.
    const newStatus = updateData.status;

    // Ensure dates are Date objects if provided
    if (typeof updateData.processedDate === 'string') updateData.processedDate = new Date(updateData.processedDate);


    // Find the current request state
    const currentRequest = await WithdrawalRequestModel.findOne({ id: requestId });
    if (!currentRequest) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    // Validate status transition if needed (e.g., only allow pending -> approved/rejected/paid)
    // For this basic implementation, we primarily handle transition *from* 'pending'.
    const isApprovedTransition = currentRequest.status === 'pending' && newStatus === 'approved';
    const isRejectedTransition = currentRequest.status === 'pending' && newStatus === 'rejected';
    // Add other transitions if needed (e.g., approved -> paid)

    // Update the request document first
    const updatedRequest = await WithdrawalRequestModel.findOneAndUpdate({ id: requestId }, updateData, { new: true });

    if (updatedRequest) {
      // --- Backend Logic: Handle Status Change, Transactions, Wallet, Stats ---
      if (isApprovedTransition) {
        console.log(`Withdrawal request ${requestId} approved.`);
        // Create a completed withdrawal transaction
        const withdrawalTransactionData = {
          id: `wtx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique frontend ID for transaction
          userId: updatedRequest.userId,
          amount: -updatedRequest.amount, // Amount is negative for balance deduction
          type: 'withdrawal',
          description: `Withdrawal processed for request ID: ${updatedRequest.id}`,
          date: new Date(), // Use server date for transaction
          status: 'completed', // Transaction is completed once request is approved/paid
          relatedUserId: null, level: null, pairs: null // Not applicable
        };
        const withdrawalTransaction = new TransactionModel(withdrawalTransactionData);
        await withdrawalTransaction.save(); // Save the transaction document

        // Link transaction ID to the request and potentially set status to 'paid'
        updatedRequest.transactionId = withdrawalTransaction.id; // Link the transaction ID (uuid string)
        updatedRequest.status = 'paid'; // Assuming 'approved' leads directly to 'paid' transactionally
        await updatedRequest.save(); // Save the request again with transactionId and 'paid' status

        // Update user wallet balance (subtract amount) and dashboard stats (move from pending to completed)
        const userWallet = await WalletModel.findOne({ userId: updatedRequest.userId });
        if (userWallet) {
          // Use atomic update for balance
          await WalletModel.updateOne({ userId: updatedRequest.userId }, { $inc: { balance: -updatedRequest.amount } }); // Subtract amount
          console.log(`Wallet balance updated for user ${updatedRequest.userId} by ${-updatedRequest.amount}.`);
        }

        const userDashboardStats = await DashboardStatsModel.findOne({ userId: updatedRequest.userId });
        if (userDashboardStats) {
          // Update dashboard stats: remove from pending, add to completed
          await DashboardStatsModel.updateOne(
            { userId: updatedRequest.userId },
            {
              $inc: {
                pendingWithdrawals: -updatedRequest.amount, // Subtract from pending
                completedWithdrawals: updatedRequest.amount // Add to completed
              },
              // Add the transaction ID to recent transactions (push reference)
              $push: {
                recentTransactions: {
                  $each: [withdrawalTransaction._id], // Push the Mongoose ObjectId
                  $sort: { date: -1 }, // Keep sorted by date (descending)
                  $slice: 10 // Keep only the latest 10
                }
              }
            }
          );
          console.log(`Dashboard stats updated for user ${updatedRequest.userId}.`);
        }


      } else if (isRejectedTransition) {
        console.log(`Withdrawal request ${requestId} rejected.`);
        // Create a completed withdrawal reversal transaction
        const reversalTransactionData = {
          id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique frontend ID
          userId: updatedRequest.userId,
          amount: updatedRequest.amount, // Amount is positive for balance addition
          type: 'withdrawal_reversal',
          description: `Reversal of rejected withdrawal request: ${updatedRequest.id}`,
          date: new Date(), // Use server date
          status: 'completed', // Transaction is completed
          relatedUserId: null, level: null, pairs: null // Not applicable
        };
        const reversalTransaction = new TransactionModel(reversalTransactionData);
        await reversalTransaction.save(); // Save the transaction document

        updatedRequest.transactionId = reversalTransaction.id; // Link the transaction ID
        await updatedRequest.save(); // Save the request again with transactionId

        // Update user wallet balance (add amount back) and dashboard stats (remove from pending)
        const userWallet = await WalletModel.findOne({ userId: updatedRequest.userId });
        if (userWallet) {
          // Use atomic update for balance
          await WalletModel.updateOne({ userId: updatedRequest.userId }, { $inc: { balance: updatedRequest.amount } }); // Add amount back
          console.log(`Wallet balance updated for user ${updatedRequest.userId} by ${updatedRequest.amount}.`);
        }

        const userDashboardStats = await DashboardStatsModel.findOne({ userId: updatedRequest.userId });
        if (userDashboardStats) {
          // Update dashboard stats: remove from pending
          await DashboardStatsModel.updateOne(
            { userId: updatedRequest.userId },
            {
              $inc: { pendingWithdrawals: -updatedRequest.amount }, // Subtract from pending
              // Add the transaction ID to recent transactions (push reference)
              $push: {
                recentTransactions: {
                  $each: [reversalTransaction._id], // Push the Mongoose ObjectId
                  $sort: { date: -1 }, // Keep sorted by date (descending)
                  $slice: 10 // Keep only the latest 10
                }
              }
            }
          );
          console.log(`Dashboard stats updated for user ${updatedRequest.userId}.`);
        }

      } else {
        console.log(`Withdrawal request ${requestId} status updated from ${currentRequest.status} to ${updatedRequest.status}. No transaction/wallet update triggered by this transition.`);
        // Handle other status transitions if needed (e.g., approved -> paid confirmation)
      }
      // --- End Backend Logic ---


      res.json(updatedRequest); // Respond with the final state of the updated request
    } else {
      res.status(404).json({ error: 'Withdrawal request not found' });
    }
  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    res.status(500).json({ error: 'Failed to update withdrawal request', details: error.message });
  }
};