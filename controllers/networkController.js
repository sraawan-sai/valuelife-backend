// src/controllers/networkController.js

import { NetworkMemberNodeModel, UserModel } from '../models/Schema.js';


// Get network node by user ID (populate children for tree traversal)
export const getNetworkNode = async (req, res) => {
    try {
        const { userId } = req.query;
       // const { userId } = req.query; // Assuming userId is passed as a query parameter
        // Find the node by the custom 'id' field and populate direct children
        // Mongoose populate works well for direct children if 'children' array stores ObjectIds or matching Strings
        const userNode = await NetworkMemberNodeModel.findOne({ id: userId }).populate('children'); // Populate direct children

        if (!userNode) {
            // Return 404 if the node doesn't exist in the collection
            return res.status(404).json({ error: 'Network node not found for user' });
        }

        res.json(userNode); // Return the node with direct children populated

    } catch (error) {
        console.error('Error getting network node:', error);
        res.status(500).json({ error: 'Failed to retrieve network node' });
    }
};

// Update network node by user ID
export const updateNetworkNode = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updateData = req.body; // Contains the updated node data

        // Ensure children array only contains IDs (frontend might send full objects or _ids)
        // If frontend sends user IDs (strings) and backend uses string refs: ok.
        // If frontend sends node objects and backend uses ObjectId refs: need conversion.
        // Assuming frontend sends updated node data and backend uses string IDs for children ref.
        if (updateData.children && Array.isArray(updateData.children)) {
            // Ensure children are just the ID strings
            updateData.children = updateData.children.map(child => typeof child === 'object' ? child.id || child._id || child : child);
            // Filter out any null/undefined if IDs are missing
            updateData.children = updateData.children.filter(id => id != null);
        }


        // Find and update the node by the custom 'id' field
        const updatedNode = await NetworkMemberNodeModel.findOneAndUpdate({ id: userId }, updateData, { new: true }); // { new: true } returns the updated document

        if (updatedNode) {
            res.json(updatedNode); // Return the updated node document
        } else {
            res.status(404).json({ error: 'Network node not found' });
        }

    } catch (error) {
        console.error('Error updating network node:', error);
        res.status(500).json({ error: 'Failed to update network node' });
    }
};

// Get root network node
// This assumes the root node corresponds to the user with sponsorId: null
export const getRootNetworkNode = async (req, res) => {
    try {
        // Find the user who is the root (sponsorId is null)
        const rootUser = await UserModel.findOne({ sponsorId: null });
        if (!rootUser) {
            // Database might be empty or no root user defined yet
            return res.status(404).json({ error: 'Root user not found' });
        }
        // Find the network node for this root user and populate children
        const rootNode = await NetworkMemberNodeModel.findOne({ id: rootUser.id }).populate('children');
        if (!rootNode) {
            // This shouldn't happen if createUser works correctly
            return res.status(404).json({ error: 'Root network node not found' });
        }
        res.json(rootNode); // Return the root node with direct children
    } catch (error) {
        console.error('Error getting root network node:', error);
        res.status(500).json({ error: 'Failed to retrieve root network node' });
    }
};

// Update root network node
export const updateRootNetworkNode = async (req, res) => {
    try {
        const rootUser = await UserModel.findOne({ sponsorId: null });
        if (!rootUser) {
            return res.status(404).json({ error: 'Root user not found' });
        }
        // Use the updateNetworkNode controller function with the root user's ID
        req.params.userId = rootUser.id; // Set the userId param
        return updateNetworkNode(req, res); // Call the update function
    } catch (error) {
        console.error('Error updating root network node:', error);
        res.status(500).json({ error: 'Failed to update root network node' });
    }
};