// src/controllers/kycController.js

import { KycRequestModel, UserModel } from '../models/Schema.js';
const { v4: uuidv4 } = require('uuid');


// Get all KYC requests
export const getAllKycRequests = async (req, res) => {
  try {
    const requests = await KycRequestModel.find().sort({ submissionDate: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error getting KYC requests:', error);
    res.status(500).json({ error: 'Failed to retrieve KYC requests' });
  }
};

// Get a single KYC request by ID
export const getKycRequestById = async (req, res) => {
  try {
    const request = await KycRequestModel.findOne({ id: req.params.id });
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({ error: 'KYC request not found' });
    }
  } catch (error) {
    console.error('Error getting KYC request by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve KYC request' });
  }
};

// Create a new KYC request (Backend logic to update user status/history)
export const createKycRequest = async (req, res) => {
  try {
    let requestData = req.body.submission;
    const userId = req.body.userId;
    const userName = req.body.userName

    if (typeof requestData.submissionDate === 'string') requestData.submissionDate = new Date(requestData.submissionDate);

    const newKyc = {
      id: uuidv4(),
      userId: userId,
      userName,
      inputValue: requestData.inputValue,
      documentType: requestData.documentType,
      status: requestData.status,
      submissionDate: requestData.submittedAt
    }

    const newRequest = new KycRequestModel(newKyc);
    await newRequest.save(); // Save the new request document

    // --- Backend Logic: Update User KYC Status and History ---
    const user = await UserModel.findOne({ id: userId });
    if (user) {
      user.kycStatus = 'pending'; // Status becomes pending when a new request is submitted
      if (!user.kycHistory) {
        user.kycHistory = [];
      }

      user.kycHistory.push(newKyc);
      await user.save(); // Save updated user document
      console.log(`User ${user.id} KYC status updated to pending and history entry added.`);
    } else {
      console.warn(`User ${newRequest.userId} not found when creating KYC request.`);
    }
    // --- End Backend Logic ---


    res.status(201).json(newRequest); // Respond with created request
  } catch (error) {
    console.error('Error creating KYC request:', error);
    res.status(500).json({ error: 'Failed to create KYC request', details: error.message });
  }
};

// Update a KYC request by ID (Backend logic to update user status/history)
export const updateKycRequest = async (req, res) => {
  try {
    const { userId, status, kycId } = req.body;

    // ✅ Use the custom 'id' field (UUID) instead of MongoDB's '_id'
    const updatedRequest = await KycRequestModel.findOneAndUpdate(
      { id: kycId },
      { status, reviewDate: new Date() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'KYC request not found' });
    }

    const user = await UserModel.findOne({ id: userId });
    if (user) {
      user.kycStatus = status;

      const pendingEntry = user.kycHistory?.find(entry => entry.status === 'pending');
      if (pendingEntry) {
        pendingEntry.status = status;
        pendingEntry.reviewedAt = new Date();
        pendingEntry.notes = updatedRequest.reviewNotes || "";
      }

      await user.save();
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating KYC request:', error);
    res.status(500).json({ error: 'Failed to update KYC request' });
  }
};

export const getKycDocumentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId; // ✅ CORRECT for GET /user/:userId/kyc-docs
    console.log("Fetching KYC docs for user:", userId);

    const docs = await KycRequestModel.find({ userId });

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('Error fetching KYC documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KYC documents' });
  }
};
