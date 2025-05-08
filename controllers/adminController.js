// src/controllers/adminController.js

import { UserModel, KycRequestModel, TransactionModel, WithdrawalRequestModel, AdminModel } from '../models/Schema.js';
import mongoose from 'mongoose'; // For direct collection access or aggregation

// Admin Authentication - Basic check
// export const validateAdminCredentials = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     // Assuming adminAuth is a single document in a 'settings' collection with _id 'adminAuth'
//     // Access the collection directly as 'settings' might not have a dedicated model
//     // const adminAuth = await mongoose.connection.collection('settings').findOne({ _id: 'adminAuth' });

//     if (!adminAuth) {
//       return res.status(404).json({ error: 'Admin credentials not configured' });
//     }

//     // In production, compare hashed passwords securely!
//     if (username === adminAuth.username && password === adminAuth.password) {
//       // Authentication successful (implement sessions/tokens here)
//       res.json({ success: true, message: 'Authentication successful' });
//     } else {
//       res.status(401).json({ success: false, error: 'Invalid credentials' });
//     }
//   } catch (error) {
//     console.error('Error validating admin credentials:', error);
//     res.status(500).json({ error: 'Failed to validate credentials' });
//   }
// };

// Update admin credentials

export const validateAdminCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;

    const adminAuth = await AdminModel.findOne({});
    if (!adminAuth) {
      return res.status(404).json({ error: 'Admin credentials not configured' });
    }

    // In production: use bcrypt to hash and compare
    if (username === adminAuth.username && password === adminAuth.password) {
      res.json({ success: true, message: 'Authentication successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error validating admin credentials:', error);
    res.status(500).json({ error: 'Failed to validate credentials' });
  }
};

export const updateAdminCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;
    // In production, hash the password before saving!
    const result = await AdminModel.updateOne(
      { $set: { username, password } }, // Update/set credentials
      { upsert: true } // Create if not exists
    );
    // Check update/upsert result acknowledged
    if (result.acknowledged) {
      res.json({ success: true, message: 'Admin credentials updated' });
    } else {
      res.status(500).json({ error: 'Failed to update credentials' });
    }
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    res.status(500).json({ error: 'Failed to update credentials' });
  }
};

// Get Admin Dashboard Stats - Aggregated from collections
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const pendingKycRequests = await KycRequestModel.countDocuments({ status: 'pending' });
    const approvedKycRequests = await KycRequestModel.countDocuments({ status: 'approved' });
    const rejectedKycRequests = await KycRequestModel.countDocuments({ status: 'rejected' });
    const totalTransactions = await TransactionModel.countDocuments();

    // Aggregate earnings (sum of completed earnings transactions)
    const earningTransactionsSum = await TransactionModel.aggregate([
      {
        $match: {
          status: 'completed',
          type: { $nin: ['withdrawal', 'withdrawal_reversal', 'admin_fee_collection'] } // Exclude these types from general earnings
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const totalEarnings = earningTransactionsSum.length > 0 ? earningTransactionsSum[0].total : 0;

    // Aggregate completed withdrawals (sum of completed withdrawal transactions - use absolute value)
    const completedWithdrawalsSum = await TransactionModel.aggregate([
      {
        $match: {
          status: 'completed',
          type: 'withdrawal'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' } // Sum the amounts (assuming they are stored as negative)
        }
      }
    ]);
    const totalWithdrawals = completedWithdrawalsSum.length > 0 ? Math.abs(completedWithdrawalsSum[0].total) : 0;


    // Aggregate pending withdrawals (sum of pending withdrawal requests)
    const pendingWithdrawalRequestsSum = await WithdrawalRequestModel.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const pendingWithdrawals = pendingWithdrawalRequestsSum.length > 0 ? pendingWithdrawalRequestsSum[0].total : 0;


    res.json({
      totalUsers,
      pendingKycRequests,
      approvedKycRequests,
      rejectedKycRequests,
      totalTransactions,
      totalEarnings,
      totalWithdrawals,
      pendingWithdrawals
    });

  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
};

// Clear Database (for testing/reset)
export const clearDatabase = async (req, res) => {
  try {
    // Delete all documents from each collection concurrently
    await Promise.all([
      UserModel.deleteMany({}),
      TransactionModel.deleteMany({}),
      NetworkMemberNodeModel.deleteMany({}),
      NetworkStatsModel.deleteMany({}),
      DashboardStatsModel.deleteMany({}),
      WalletModel.deleteMany({}),
      CommissionStructureModel.deleteMany({}),
      KycRequestModel.deleteMany({}),
      WithdrawalRequestModel.deleteMany({}),
      OrderModel.deleteMany({}),
      FileModel.deleteMany({}),
      // Clear settings collection (including adminAuth)
      mongoose.connection.collection('settings').deleteMany({})
    ]);

    // Optionally recreate default settings after clearing
    // const initialAdminAuth = { username: 'admin', password: 'admin123' }; // Get from config
    // await mongoose.connection.collection('settings').insertOne({ _id: 'adminAuth', ...initialAdminAuth });
    // const initialCommissionStructure = { ... }; // Get from config
    // await CommissionStructureModel.create(initialCommissionStructure);

    res.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
};