// server.js - Combined version (MongoDB Active, Old fs/db.json Commented Out)

import express from 'express';
import cors from 'cors';

// --- Imports for the NEW MongoDB version (ACTIVE) ---
import dotenv from 'dotenv'; // To load variables from .env
import connectDB from './db.js'; // Import the MongoDB connection function

// Import route files that handle API logic using Mongoose models
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // Includes /admin/login and /clear
import settingsRoutes from './routes/settingsRoutes.js'; // Includes /commissionStructure and potentially /currentUser
import statsRoutes from './routes/statsRoutes.js'; // Includes /stats/network and /stats/dashboard
import networkRoutes from './routes/networkRoutes.js'; // Includes /network/:userId and /network/root
import productRoutes from './routes/productRoutes.js'; // Includes /products/*

// --- Imports for the OLD db.json version (COMMENTED OUT) ---
/*
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
*/


// --- Configuration ---
dotenv.config(); // Load environment variables (used by NEW version)

const app = express();
const PORT = process.env.PORT || 3001; // PORT from .env


// --- Middleware (Used by BOTH versions, keep active) ---
app.use(express.json({ limit: '50mb' })); // Parse incoming JSON requests. Increase limit for base64 files.
app.use(cors({
  origin: 'https://valuelife.vercel.app', // allow your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // if you need to send cookies or auth headers
})); // Enable CORS for all origins (adjust in production)


// --- Database Connection (NEW MongoDB version - ACTIVE) ---
connectDB(); // Connect to MongoDB


// --- Database Helpers (OLD db.json version - COMMENTED OUT) ---
/*
// Get __filename and __dirname in ES module context (needed for file paths)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, 'src', 'data', 'db.json');

// Helper functions to read from the db.json file
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    if (error.code === 'ENOENT') {
        console.warn('Database file not found. Returning empty structure.');
        const initialData = {
            currentUser: null, users: [], transactions: [], networkMembers: null, networkStats: {},
            dashboardStats: {}, wallet: null, commissionStructure: null, products: [],
            adminAuth: null, kycRequests: [], withdrawalRequests: [], orders: [], files: []
        };
        try { fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8'); return initialData; }
        catch (writeError) { console.error('Error writing initial database file:', writeError); return null; }
    }
    return null;
  }
};

// Helper functions to write to the db.json file
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
};
*/


// --- API Endpoints (NEW MongoDB version - ACTIVE) ---
// Mount routers under the /api/db base path.
// These routes are handled by controllers that use Mongoose.

app.use('/api/db/users', userRoutes); // Handles /api/db/users/*
app.use('/api/db/transactions', transactionRoutes); // Handles /api/db/transactions/*
app.use('/api/db/kycRequests', kycRoutes); // Handles /api/db/kycRequests/*
app.use('/api/db/withdrawalRequests', withdrawalRoutes); // Handles /api/db/withdrawalRequests/*
app.use('/api/db/orders', orderRoutes); // Handles /api/db/orders/*
app.use('/api/db/products', productRoutes); // Handles /api/db/products/*
app.use('/api/db/files', fileRoutes); // Handles /api/db/files/*
app.use('/api/db/admin', adminRoutes); // Handles /api/db/admin/* (e.g., /api/db/admin/login)
app.use('/api/db', settingsRoutes); // Handles /api/db/commissionStructure and /api/db/currentUser
app.use('/api/db/stats', statsRoutes); // Handles /api/db/stats/*
app.use('/api/db/network', networkRoutes); // Handles /api/db/network/*

// Mount the /clear route directly at /api/db/clear (assuming adminRoutes exports handler)
// Note: The order matters if multiple routes match. Specific routes should be mounted before more general ones.
// Placing this after mounting the router at /api/db/admin might prevent it from being hit directly depending on definitions.
// A cleaner way might be to define /clear explicitly in this file and import the handler,
// or ensure the adminRoutes router handles the exact '/clear' path correctly.
// Let's add it explicitly here for clarity, importing the handler.
// import { clearDatabase } from './src/controllers/adminController.js'; // Import the specific controller function
// app.post('/api/db/clear', clearDatabase); // Mount the POST /api/db/clear endpoint


// --- API Endpoints (OLD db.json version - COMMENTED OUT) ---
/*
// Get the entire database state
app.get('/api/db', (req, res) => {
  const data = readDatabase();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// Get a specific section of the database (e.g., /api/db/users)
app.get('/api/db/:section', (req, res) => {
  const { section } = req.params;
  const data = readDatabase();

  if (!data) {
    return res.status(500).json({ error: 'Failed to read database' });
  }

  if (data[section] === undefined) {
    return res.status(404).json({ error: `Section "${section}" not found` });
  }

  res.json(data[section]);
});

// Update (replace) a specific section of the database (e.g., POST /api/db/users body: [...updatedUsers])
app.post('/api/db/:section', (req, res) => {
  const { section } = req.params;
  const newData = req.body;
  const data = readDatabase();

  if (!data) {
    return res.status(500).json({ error: 'Failed to read database' });
  }

  // Note: This replaces the entire content of the section with newData.
  data[section] = newData;

  const success = writeDatabase(data);
  if (success) {
    res.json({ success: true, message: `Updated section "${section}"` });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Add item to an array in the database (e.g., POST /api/db/transactions/add body: { ...newTransaction })
app.post('/api/db/:section/add', (req, res) => {
  const { section } = req.params;
  const newItem = req.body;
  const data = readDatabase();

  if (!data) {
    return res.status(500).json({ error: 'Failed to read database' });
  }

  if (data[section] === undefined) {
    return res.status(404).json({ error: `Section "${section}" not found` });
  }
  if (!Array.isArray(data[section])) {
    return res.status(400).json({ error: `Section "${section}" is not an array` });
  }

  data[section].push(newItem);

  const success = writeDatabase(data);
  if (success) {
    res.json({ success: true, message: `Added item to "${section}"` });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Special endpoint to update the current user setting and the user within the users array
// POST /api/db/currentUser/update body: { ...updatedUserObjectIncludingId }
app.post('/api/db/currentUser/update', (req, res) => {
  const userData = req.body;
  const data = readDatabase();

  if (!data) {
    return res.status(500).json({ error: 'Failed to read database' });
  }

  // Update the 'currentUser' field at the top level
  data.currentUser = userData;

  // Also find and update the user within the 'users' array if it exists
  if (data.users && Array.isArray(data.users) && userData && userData.id) {
    const userIndex = data.users.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
      data.users[userIndex] = userData; // Replace the old user object in the array
    } else {
        console.warn(`User with ID ${userData.id} not found in 'users' array during currentUser update.`);
    }
  } else {
      console.warn("Cannot update user in 'users' array: 'users' is not an array or userData is missing ID.");
  }


  const success = writeDatabase(data);
  if (success) {
    res.json({ success: true, message: 'Updated current user' });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});
*/
// ----------------------------------------------
// ✅ SMS Sending Endpoint (No password in URL)
// ----------------------------------------------
app.get('/api/send-sms', async (req, res) => {
  const { phone, customerId, password } = req.query;

  // Check for required parameters
  if (!phone || !customerId || !password) {
    return res.status(400).send('Missing parameters: phone, customerId, or password');
  }

  // Include admin numbers
  const adminNumbers = '9705259696,9701666220';
  const to_mobileno = `${phone},${adminNumbers}`;

  // Your approved DLT template message (ensure this matches exactly)
  const smsText = `Welcome to VALUE LIFE Family. Your Account Created and your customer ID is: ${customerId} with password: ${password}. Please do not share with anyone. valuelife.in`;

  // URL encode the SMS text
  const encodedText = encodeURIComponent(smsText);

  // Fixed DLT template ID you provided
  const t_id = '1707174279305340223';

  // SMS API endpoint with dynamic values
  const smsApiUrl = `https://login5.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=valuelifefamily&pass=Value@123&sender=VLMPVT&to_mobileno=${to_mobileno}&sms_text=${encodedText}&t_id=${t_id}`;

  try {
    const response = await fetch(smsApiUrl);
    const result = await response.text();

    console.log('✅ SMS API response:', result);
    res.send(result);
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    res.status(500).send('Failed to send SMS');
  }
});


// --- Root endpoint for the whole server (Used by BOTH versions, keep active) ---
app.get('/', (req, res) => {
  res.send('MLM Demo Backend Server is running');
});


// --- Error Handling Middleware (Optional but Highly Recommended - Used by NEW version) ---
// This middleware catches errors that occur during request processing in any of the routes.
// It should be mounted *after* all your routes so it catches errors thrown by them.
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace to the server console
  // Send a generic error response to the client.
  // In production, avoid sending detailed error stack traces to the client.
  res.status(500).send({ error: 'An internal server error occurred!', details: err.message });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Confirm which database is being used based on the active code
  console.log(`Active Database: MongoDB`); // Indicate the NEW version is active
  // In the old version, this would be: console.log(`Using database file: ${DB_PATH}`);
  console.log(`Attempting to connect to MongoDB at: ${process.env.MONGODB_URI}`); // Indicate which DB connection string is used
});