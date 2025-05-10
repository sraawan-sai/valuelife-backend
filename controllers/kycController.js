// src/controllers/kycController.js

import { KycRequestModel, UserModel } from '../models/Schema.js';
import { v4 as uuidv4 } from 'uuid';


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
    const userName = req.body.userName;

    if (typeof requestData.submissionDate === 'string') {
      requestData.submissionDate = new Date(requestData.submissionDate);
    }

    const existingRequest = await KycRequestModel.findOne({
      userId: userId,
      documentType: requestData.documentType
    });

    let kycEntry = {
      userId,
      userName,
      inputValue: requestData.inputValue,
      documentType: requestData.documentType,
      status: requestData.status,
      submissionDate: requestData.submittedAt
    };

    let savedRequest;

    if (existingRequest) {
      // Replace existing request with new data
      Object.assign(existingRequest, kycEntry);
      savedRequest = await existingRequest.save();
      console.log(`Updated existing KYC document for user ${userId} and documentType ${requestData.documentType}`);
    } else {
      // Create new KYC request
      const newKyc = {
        id: uuidv4(),
        ...kycEntry
      };
      const newRequest = new KycRequestModel(newKyc);
      savedRequest = await newRequest.save();
      console.log(`Created new KYC document for user ${userId}`);
    }

    // --- Update User Model ---
    const user = await UserModel.findOne({ id: userId });
    if (user) {
      user.kycStatus = 'pending';
      if (!user.kycHistory) user.kycHistory = [];

      // Remove any previous history entry with same documentType
      user.kycHistory = user.kycHistory.filter(
        entry => entry.documentType !== requestData.documentType
      );

      user.kycHistory.push({
        id: savedRequest.id,
        ...kycEntry
      });

      await user.save();
      console.log(`User ${user.id} KYC status set to pending and updated history`);
    } else {
      console.warn(`User ${userId} not found`);
    }

    res.status(201).json(savedRequest);

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
