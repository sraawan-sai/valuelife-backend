// src/controllers/settingsController.js

import { CommissionStructureModel } from '../models/Schema.js';
// If using a general Settings model or direct collection access, import mongoose
import mongoose from 'mongoose';


// --- Commission Structure ---
// Get commission structure (single document)
export const getCommissionStructure = async (req, res) => {
    try {
        // Find the single document in the CommissionStructure collection
        const structure = await CommissionStructureModel.findOne({}); // Finds the first/only one
        if (structure) {
            res.json(structure);
        } else {
            // Return 404 if not found
            res.status(404).json({ error: 'Commission structure not found' });
        }
    } catch (error) {
        console.error('Error getting commission structure:', error);
        res.status(500).json({ error: 'Failed to retrieve commission structure' });
    }
};

// Update commission structure (single document)
export const updateCommissionStructure = async (req, res) => {
    try {
        // Find and update the single document. Use upsert: true to create if it doesn't exist.
        const updatedStructure = await CommissionStructureModel.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json(updatedStructure);
    } catch (error) {
        console.error('Error updating commission structure:', error);
        res.status(500).json({ error: 'Failed to update commission structure' });
    }
};

// --- Current User Setting (If using a setting document for login state) ---
// This should ideally be handled by authentication middleware/sessions.
// If implementing the setting document method:
/*
import { UserModel } from '../models/index.js'; // Import UserModel


export const getCurrentUserSetting = async (req, res) => {
    try {
        // Assuming you store 'currentUser' as a setting document with a fixed _id 'currentUser'
        const currentUserSetting = await mongoose.connection.collection('settings').findOne({ _id: 'currentUser' });
         if (currentUserSetting && currentUserSetting.userId) { // Assuming it stores userId
             const user = await UserModel.findOne({ id: currentUserSetting.userId }); // Find the actual user by ID
             if (user) {
                 res.json(user); // Return the full user object
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
          const userExists = await UserModel.exists({ id: userId });
          if (!userExists) {
              return res.status(404).json({ error: 'User with provided ID does not exist' });
          }

         // Update the 'currentUser' setting document, storing the user ID
         const result = await mongoose.connection.collection('settings').updateOne(
             { _id: 'currentUser' },
             { $set: { userId: userId } }, // Store the user ID (uuid string)
             { upsert: true }
         );
         // Fetch the updated user document to return (as frontend expects the User object)
          const updatedUser = await UserModel.findOne({ id: userId });
          if (updatedUser) {
              res.json(updatedUser);
          } else {
              // Should not happen if userExists check passed
              res.status(500).json({ error: 'Internal error fetching user after setting as current' });
          }
     } catch (error) {
         console.error('Error updating current user setting:', error);
         res.status(500).json({ error: 'Failed to update current user setting' });
     }
};
*/