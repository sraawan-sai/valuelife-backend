import { NetworkStatsModel, DashboardStatsModel } from '../models/Schema.js';

// --- Network Stats ---

// Get network stats (can be root or user-specific based on identifier)
export const getNetworkStats = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const filter = identifier !== 'root' ? { userId: identifier } : { userId: null };

    const stats = await NetworkStatsModel.findOne(filter);
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: `Network stats not found for identifier ${identifier}` });
    }
  } catch (error) {
    console.error('Error getting network stats:', error);
    res.status(500).json({ error: 'Failed to retrieve network stats' });
  }
};

// Update network stats (can be root or user-specific)
export const updateNetworkStats = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const filter = identifier !== 'root' ? { userId: identifier } : { userId: null };

    // Optional: Validate object shape (if needed)
    if (req.body.levelWiseCount && typeof req.body.levelWiseCount !== 'object') {
      return res.status(400).json({ error: 'Invalid levelWiseCount format' });
    }

    const updatedStats = await NetworkStatsModel.findOneAndUpdate(
      filter,
      req.body,
      { upsert: true, new: true }
    );

    res.json(updatedStats);
  } catch (error) {
    console.error('Error updating network stats:', error);
    res.status(500).json({ error: 'Failed to update network stats' });
  }
};

// --- Dashboard Stats ---

// Get dashboard stats (can be root or user-specific based on identifier)
export const getDashboardStats = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const filter = identifier !== 'root' ? { userId: identifier } : { userId: null };

    const stats = await DashboardStatsModel.findOne(filter).populate('recentTransactions');
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: `Dashboard stats not found for identifier ${identifier}` });
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
  }
};

// Update dashboard stats (can be root or user-specific)
export const updateDashboardStats = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const filter = identifier !== 'root' ? { userId: identifier } : { userId: null };

    // Optional: Validate object shape (if needed)
    if (req.body.earningsByType && typeof req.body.earningsByType !== 'object') {
      return res.status(400).json({ error: 'Invalid earningsByType format' });
    }

    const updatedStats = await DashboardStatsModel.findOneAndUpdate(
      filter,
      req.body,
      { upsert: true, new: true }
    );

    res.json(updatedStats);
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
    res.status(500).json({ error: 'Failed to update dashboard stats' });
  }
};
