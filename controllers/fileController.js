// src/controllers/fileController.js

import { FileModel } from '../models/Schema.js';


// Get files (optionally filter by userId or storageKey)
export const getAllFiles = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.storageKey) {
      // Allow multiple storage keys separated by comma
      filter.storageKey = { $in: req.query.storageKey.split(',') };
    }
    const files = await FileModel.find(filter).sort({ uploadDate: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
};

// Get a single file by ID
export const getFileById = async (req, res) => {
  try {
    // Find by the frontend 'id' field
    const file = await FileModel.findOne({ id: req.params.fileId });
    if (file) {
      res.json(file); // Return the file document
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error getting file by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
};


// Create a new file (upload base64)
export const createFile = async (req, res) => {
  try {
    const fileData = req.body; // Should contain { id, userId, storageKey, name, type, size, lastModified, base64, uploadDate }
    // Ensure dates are Date objects
    if (typeof fileData.uploadDate === 'string') fileData.uploadDate = new Date(fileData.uploadDate);

    const newFile = new FileModel(fileData);
    await newFile.save(); // Save the file document

    res.status(201).json(newFile); // Respond with created file document (includes Mongoose _id)
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
};

// Delete a file by ID
export const deleteFile = async (req, res) => {
  try {
    // Find and delete by the frontend 'id' field
    const deletedFile = await FileModel.findOneAndDelete({ id: req.params.fileId });
    if (deletedFile) {
      res.json({ message: 'File deleted successfully' }); // Respond with success message
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};