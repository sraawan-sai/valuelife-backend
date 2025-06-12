// src/controllers/userController.js

import { UserModel, WalletModel, NetworkStatsModel, DashboardStatsModel, NetworkMemberNodeModel, TransactionModel, FileModel, KycRequestModel, WithdrawalRequestModel, OrderModel } from '../models/Schema.js';
import mongoose from 'mongoose'; // Import mongoose for ObjectId or other utilities


// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findOne({ id: req.params.userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Create a new user (and create associated documents)
export const createUser = async (req, res) => {
  try {
    const userData = req.body.newUser;
    console.log("userData:", userData);

    // Ensure required initial data exists or create defaults
    if (!userData.id) userData.id = new mongoose.Types.ObjectId().toString(); // Consider consistent ID strategy (uuid vs ObjectId)
    if (!userData.registrationDate) userData.registrationDate = new Date(); // Use server date
    if (!userData.kycStatus) userData.kycStatus = 'pending';
    if (!userData.kycDocuments) userData.kycDocuments = {};
    if (!userData.bankDetails) userData.bankDetails = {};
    if (!userData.kycHistory) userData.kycHistory = [];

    const newUser = new UserModel(userData);
    console.log("newUser", newUser);


    await newUser.save(); // Save user first

    // Create associated documents for the new user concurrently
    await Promise.all([
      // Wallet
      WalletModel.create({ userId: newUser.id, balance: 0 }),

      // Network Stats (for this user's downline)
      NetworkStatsModel.create({
        userId: newUser.id,
        totalMembers: 1, // User themselves
        directReferrals: 0,
        activeMembers: 1,
        inactiveMembers: 0,
        levelWiseCount: {}, dailyGrowth: [], weeklyGrowth: [], monthlyGrowth: []
      }),

      // Dashboard Stats (for this user's earnings/team)
      DashboardStatsModel.create({
        userId: newUser.id,
        totalEarnings: 0, pendingWithdrawals: 0, completedWithdrawals: 0,
        directReferrals: 0, teamSize: 1, recentTransactions: [],
        earningsByType: {}, earningsTimeline: []
      }),

      // Network Node (for building the tree)
      NetworkMemberNodeModel.create({
        id: newUser.id, // Use user's ID
        name: newUser.name,
        profilePicture: newUser.profilePicture,
        referralCode: newUser.referralCode,
        joinDate: newUser.registrationDate,
        active: true, // New users are active
        children: []
      })
    ]);
// --- ADD THIS BLOCK ---
const { placementId, id: childUserId, position } = newUser;
    if (placementId && position) {
      await NetworkMemberNodeModel.findOneAndUpdate(
        { referralCode: placementId },
        {
          $push: {
            children: {
              childUserId,
              position: position
            }
          }
        }
      );
    }
// --- END BLOCK ---
    res.status(201).json(newUser); // Respond with created user
  }
  catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update a user by ID
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;
    // Prevent updating immutable fields like ID if necessary
    delete updateData.id;
    delete updateData._id; // Mongoose _id is internal

    // Handle nested updates like bankDetails, kycDocuments, kycHistory carefully
    // Using findOneAndUpdate with req.body works for top-level fields and replacing embedded documents.
    // For pushing to arrays (like kycHistory), need $push operator.
    // This controller assumes req.body contains the *entire* updated state for embedded docs/arrays being modified.
    // If frontend only sends a partial update including pushes/pulls to arrays, the logic here needs adjustment.
    // Simple approach: If req.body has kycHistory, assume it's the new full array.

    const updatedUser = await UserModel.findOneAndUpdate({ id: userId }, updateData, { new: true });
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user by ID:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user by ID (cascade delete related data)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Delete user document
    const deletedUser = await UserModel.findOneAndDelete({ id: userId });
    if (deletedUser) {
      // Delete associated data concurrently
      await Promise.all([
        TransactionModel.deleteMany({ userId: userId }),
        WalletModel.deleteOne({ userId: userId }),
        NetworkStatsModel.deleteOne({ userId: userId }),
        DashboardStatsModel.deleteOne({ userId: userId }),
        FileModel.deleteMany({ userId: userId }),
        KycRequestModel.deleteMany({ userId: userId }),
        WithdrawalRequestModel.deleteMany({ userId: userId }),
        OrderModel.deleteMany({ userId: userId }),
        NetworkMemberNodeModel.deleteOne({ id: userId })
        // Need to also remove this node's ID from its parent's 'children' array.
        // This involves finding the parent node and pulling the child ID.
        // Example: Find node where children array contains userId, then use $pull
        // NetworkMemberNodeModel.updateOne({ children: userId }, { $pull: { children: userId } })
      ]);


      res.json({ message: 'User and associated data deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user by ID:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get current user setting (if using a setting document for login state)
// This should ideally be handled by authentication middleware/sessions.
// If implementing the setting document method:
/*
import mongoose from 'mongoose'; // Needed if using direct collection access

export const getCurrentUserSetting = async (req, res) => {
    try {
        const currentUserSetting = await mongoose.connection.collection('settings').findOne({ _id: 'currentUser' });
         if (currentUserSetting && currentUserSetting.userId) { // Assuming it stores userId
             const user = await UserModel.findOne({ id: currentUserSetting.userId });
             if (user) {
                 res.json(user);
             } else {
                 // Stored user ID doesn't match a user - clear the setting
                 await mongoose.connection.collection('settings').deleteOne({ _id: 'currentUser' });
                 res.status(404).json({ error: 'Current user setting points to non-existent user' });
             }
         } else {
             res.status(404).json({ error: 'Current user setting not found' });
         }
    } catch (error) {
        console.error('Error getting current user setting:', error);
        res.status(500).json({ error: 'Failed to retrieve current user setting' });
    }
};

export const updateCurrentUserSetting = async (req, res) => {
     try {
         const { userId } = req.body; // Frontend sends the ID to set as current
         if (!userId) {
              return res.status(400).json({ error: 'User ID is required' });
         }
          // Optional: Verify the user ID exists in the User collection first

         const result = await mongoose.connection.collection('settings').updateOne(
             { _id: 'currentUser' },
             { $set: { userId: userId } }, // Store the user ID
             { upsert: true }
         );
         // Fetch the updated user document to return (as frontend expects the User object)
          const updatedUser = await UserModel.findOne({ id: userId });
          if (updatedUser) {
              res.json(updatedUser);
          } else {
              res.status(404).json({ error: 'User not found after setting as current' });
          }
     } catch (error) {
         console.error('Error updating current user setting:', error);
         res.status(500).json({ error: 'Failed to update current user setting' });
     }
};
*/