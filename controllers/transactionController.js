// src/controllers/transactionController.js

import { TransactionModel, WalletModel, DashboardStatsModel } from '../models/Schema.js'; // Import models


// Get all transactions (optionally filter by userId, type, status)
export const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.type) filter.type = { $in: req.query.type.split(',') };
    if (req.query.status) filter.status = { $in: req.query.status.split(',') };

    const transactions = await TransactionModel.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
};

// Get a single transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await TransactionModel.findOne({ id: req.params.transactionId });
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error getting transaction by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
};

// Create a new transaction (Backend logic to update wallet/stats here)
export const createTransaction = async (req, res) => {
  try {
    const transactionData = req.body;
    // Ensure date is Date object
    if (typeof transactionData.date === 'string') transactionData.date = new Date(transactionData.date);

    const transaction = new TransactionModel(transactionData);
    await transaction.save(); // Save the new transaction document

    // --- Backend Logic: Update User Wallet and Dashboard Stats ---
    // Perform updates only for completed transactions affecting balance/stats
    if (transaction.status === 'completed') {
      // Update user wallet balance
      let balanceChange = 0;
      // Determine balance change based on transaction type
      if (transaction.type === 'withdrawal') balanceChange = -transaction.amount; // Subtract withdrawal amount (amount is positive in request body)
      else if (transaction.type === 'withdrawal_reversal') balanceChange = transaction.amount; // Add reversal amount
      else balanceChange = transaction.amount; // Add earnings/credits


      // Use atomic update for balance
      const walletUpdateResult = await WalletModel.updateOne({ userId: transaction.userId }, { $inc: { balance: balanceChange } });
      if (walletUpdateResult.matchedCount === 0) {
        console.warn(`Wallet not found for user ${transaction.userId} to update balance after transaction ${transaction.id}.`);
        // Consider creating the wallet here if it should always exist
      } else {
        console.log(`Wallet balance updated for user ${transaction.userId} by ${balanceChange}.`);
      }


      // Update user dashboard stats (assuming user-specific stats documents exist)
      const dashboardUpdate = {};
      const dashboardInc = {};

      // Update total earnings (Exclude withdrawals and reversals from earnings total)
      if (transaction.type !== 'withdrawal' && transaction.type !== 'withdrawal_reversal') {
        dashboardInc.totalEarnings = transaction.amount;
      }

      // Update earnings by type (Use $inc with Mongoose for atomic update)
      const amountForStats = (transaction.type === 'withdrawal' || transaction.type === 'withdrawal_reversal')
        ? Math.abs(transaction.amount) // Use absolute amount for stat aggregation
        : transaction.amount;

      const earningsByTypeKey = `earningsByType.${transaction.type}`; // e.g., 'earningsByType.retail_profit'
      dashboardInc[earningsByTypeKey] = (transaction.type === 'withdrawal' ? -amountForStats : amountForStats);


      // Update completed withdrawals if applicable (amount is positive in request body)
      if (transaction.type === 'withdrawal') {
        dashboardInc.completedWithdrawals = amountForStats;
      }
      // Pending withdrawals are handled by the withdrawal request status change


      // Add transaction reference to recent transactions (use $push and $slice)
      // We need the Mongoose _id of the transaction just saved
      dashboardUpdate.$push = {
        recentTransactions: {
          $each: [transaction._id], // Push the Mongoose ObjectId
          $sort: { date: -1 }, // Keep sorted by date (descending)
          $slice: 10 // Keep only the latest 10
        }
      };


      // Update earnings timeline (add net effect to today's entry)
      // This requires finding or adding an entry for today and updating its total amount.
      // Can use $push with $slice and $sort, but updating an existing entry is tricky with simple $push/$slice.
      // A better approach: fetch stats, update timeline array in memory, save stats.
      // Or, use aggregation/a separate job to build the timeline.
      // Let's simulate updating the latest day's total using $inc on the amount field within the matching subdocument.
      // This requires finding the specific date array element - complex query.
      // Simpler approach for demo: just update the *last* entry (assuming it's today).

      const today = new Date(transaction.date).toISOString().split('T')[0];
      const netEffect = (transaction.type === 'withdrawal' || transaction.type === 'withdrawal_reversal')
        ? transaction.amount // Amount is negative for withdrawal, positive for reversal
        : transaction.amount; // Amount is positive for earnings

      // Attempt to find and update today's timeline entry, or add one
      // Use aggregation pipeline or fetch/save approach. Fetch/save is simpler for demo.
      const dashboardToUpdateForTimeline = await DashboardStatsModel.findOne({ userId: transaction.userId });
      if (dashboardToUpdateForTimeline) {
        const timelineEntry = dashboardToUpdateForTimeline.earningsTimeline.find(entry => {
          // Compare dates only (ignore time)
          return entry.date.toISOString().split('T')[0] === today;
        });

        if (timelineEntry) {
          timelineEntry.amount += netEffect;
        } else {
          // Add a new entry for today, potentially carrying over yesterday's total
          const lastEntryAmount = dashboardToUpdateForTimeline.earningsTimeline.length > 0
            ? dashboardToUpdateForTimeline.earningsTimeline[dashboardToUpdateForTimeline.earningsTimeline.length - 1].amount
            : 0;
          // Note: This simple approach might have issues if transactions for different days arrive out of order.
          dashboardToUpdateForTimeline.earningsTimeline.push({ date: new Date(today), amount: lastEntryAmount + netEffect });
        }
        // Keep timeline length reasonable? Or handle on frontend display?
        // dashboardToUpdateForTimeline.earningsTimeline = dashboardToUpdateForTimeline.earningsTimeline.slice(-30); // Keep last 30 days?

        await dashboardToUpdateForTimeline.save(); // Save the dashboard with updated timeline
        console.log(`Dashboard timeline updated for user ${transaction.userId}.`);
      } else {
        console.warn(`DashboardStats not found for user ${transaction.userId} to update timeline after transaction ${transaction.id}.`);
      }


      // Combine $inc updates and $push update
      if (Object.keys(dashboardInc).length > 0) {
        // Only apply $inc if there are fields to increment
        await DashboardStatsModel.updateOne(
          { userId: transaction.userId },
          { $inc: dashboardInc }
        );
      }
      // Update recent transactions separately if not combined
      await DashboardStatsModel.updateOne(
        { userId: transaction.userId },
        {
          $push: {
            recentTransactions: {
              $each: [transaction._id],
              $sort: { date: -1 },
              $slice: 10
            }
          }
        }
      );


    } else if (transaction.status === 'pending' && transaction.type === 'withdrawal') {
      // Update pending withdrawals stat on dashboard if applicable
      // Assuming amount for pending withdrawal transaction is positive
      const userDashboardStats = await DashboardStatsModel.findOne({ userId: transaction.userId });
      if (userDashboardStats) {
        // Use $inc for atomic update
        await DashboardStatsModel.updateOne({ userId: transaction.userId }, { $inc: { pendingWithdrawals: transaction.amount } });
        console.log(`Dashboard stats pending withdrawals updated for user ${transaction.userId}.`);
      } else {
        console.warn(`DashboardStats not found for user ${transaction.userId} to update pending withdrawals.`);
      }
    }
    // --- End Backend Logic ---


    res.status(201).json(transaction); // Respond with the created transaction document
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
};