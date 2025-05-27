// src/models/index.js

import mongoose, { Schema } from 'mongoose';
// If using shared types, you can import them here for type checking in JS (requires build step)
// import { User, Transaction, ... } from '../../types'; // Adjust path

// --- Define Mongoose Schemas ---

// Embedded Schema for Bank Details
const BankDetailsSchema = new Schema({
  accountName: { type: String },
  accountNumber: { type: String },
  bankName: { type: String },
  ifscCode: { type: String }
}, { _id: false });

// Embedded Schema for KYC Documents structure (references StoredFile IDs)
const KycDocumentsRefsSchema = new Schema({
  idProof: { type: String },
  addressProof: { type: String },
  bankDetails: { type: String }
}, { _id: false });

// Embedded Schema for KYC Submission History
const KycSubmissionSchema = new Schema({
  documentType: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  notes: { type: String }
}, { _id: false });


// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true }, // Frontend generated uuid
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  distributorId: { type: String, required: true, unique: true },
  profilePicture: { type: String }, // Reference File collection
  sponsorId: { type: String, default: null }, // User ID of sponsor (uuid)
  referralCode: { type: String, unique: true },
  registrationDate: { type: Date, required: true },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocuments: { type: KycDocumentsRefsSchema, default: {} },
  bankDetails: { type: BankDetailsSchema, default: {} },
  password: { type: String }, // STORE HASHED PASSWORDS IN PRODUCTION!
  kycHistory: [KycSubmissionSchema] // Embedded array
});

// Transaction Schema
const TransactionSchema = new Schema({
  id: { type: String, unique: true }, // Frontend generated uuid
  userId: { type: String, required: true, ref: 'User' }, // User ID who earned/was affected
  amount: { type: Number, required: true },
  type: { type: String, enum: ['retail_profit', 'referral_bonus', 'team_matching', 'royalty_bonus', 'repurchase_bonus', 'award_reward', 'withdrawal', 'withdrawal_reversal', 'admin_fee_collection'], required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], required: true },
  relatedUserId: { type: String, ref: 'User' }, // For referral/level commissions (the user who caused the commission)
  level: { type: Number }, // For level commissions
  pairs: { type: Number } // For team matching bonus
});

// Network Member Node Schema (store individual nodes)
const NetworkMemberNodeSchema = new Schema({
  id: { type: String, required: true, unique: true }, // Corresponds to User ID (uuid)
  name: { type: String },
  profilePicture: { type: String }, // Or ref to File if not base64 here
  referralCode: { type: String },
  joinDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  // Store direct children IDs as strings matching User.id / Node.id (uuid strings)
  children: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  // Reference User collection (or NetworkMemberNode) by ID string
});

// Network Stats Schema (store one per user, or one global)
const NetworkStatsSchema = new Schema({
  userId: { type: String, unique: true, sparse: true, ref: 'User' }, // Link to User ID (uuid string), unique + sparse allows one document with userId: null for root
  totalMembers: { type: Number, default: 0 },
  directReferrals: { type: Number, default: 0 },
  activeMembers: { type: Number, default: 0 },
  inactiveMembers: { type: Number, default: 0 },
  levelWiseCount: { type: Map, of: Number, default: {} }, // Map level (string key '1', '2') to count
  dailyGrowth: [{ date: { type: Date }, count: { type: Number } }],
  weeklyGrowth: [{ week: { type: String }, count: { type: Number } }],
  monthlyGrowth: [{ month: { type: String }, count: { type: Number } }]
});

// Dashboard Stats Schema (store one per user, or one global)
const DashboardStatsSchema = new Schema({
  userId: { type: String, unique: true, sparse: true, ref: 'User' }, // Link to User ID (uuid string)
  totalEarnings: { type: Number, default: 0 },
  pendingWithdrawals: { type: Number, default: 0 },
  completedWithdrawals: { type: Number, default: 0 },
  directReferrals: { type: Number, default: 0 },
  teamSize: { type: Number, default: 0 },
  recentTransactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }], // Store Transaction Mongoose _ids and populate
  earningsByType: { type: Map, of: Number, default: {} }, // Map type (string key 'retail_profit') to total amount
  earningsTimeline: [{ date: { type: Date }, amount: { type: Number } }]
});

// Wallet Schema (store one per user)
const WalletSchema = new Schema({
  userId: { type: String, required: true, unique: true, ref: 'User' }, // Link to User (uuid string), one wallet per user
  balance: { type: Number, default: 0 },
  // transactions array is derived, not stored here
});

// Commission Structure Schema (single document)
const CommissionStructureSchema = new Schema({
  // Mongoose adds _id. Find the single document.
  retailProfit: { min: { type: Number }, max: { type: Number } },
  directReferralBonus: { type: Number },
  firstMatchingBonus: { type: Number },
  teamMatchingBonus: { type: Number },
  teamMatchingDailyCap: { type: Number },
  royaltyBonus: { type: Number }, // Stored as percentage (e.g., 2)
  repurchaseBonus: { type: Number }, // Stored as percentage (e.g., 3)
  milestoneRewards: {
    pairs: { type: Map, of: new Schema({ type: String, value: Schema.Types.Mixed }, { _id: false }), default: {} } // Map pair count string ('1') to reward object
  },
  levelCommissions: { type: Map, of: Number, default: {} }, // Map level string ('1') to rate (e.g., 0.07)
  tdsPercentage: { type: Number }, // Stored as percentage (e.g., 5)
  adminFeePercentage: { type: Number }, // Stored as percentage (e.g., 10)
  repurchasePercentage: { type: Number } // Stored as percentage (e.g., 3)
});

// KYC Request Schema
const KycRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' }, // User ID (uuid string)
  userName: { type: String, required: true }, // Denormalize
  inputValue: { type: String, required: true },
  documentType: { type: String, required: true },
  // documents: { // References to uploaded files by Mongoose ObjectId
  //   idProof: { type: Schema.Types.ObjectId, ref: 'File' },
  //   addressProof: { type: Schema.Types.ObjectId, ref: 'File' },
  //   bankDetails: { type: Schema.Types.ObjectId, ref: 'File' }
  // },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submissionDate: { type: Date, required: true },
  reviewDate: { type: Date },
  reviewNotes: { type: String }
});

// Withdrawal Request Schema
const WithdrawalRequestSchema = new Schema({
  //id: { type: String, required: true, unique: true }, // Frontend generated uuid
  userId: { type: String, required: true, ref: 'User' }, // User ID (uuid string)
  userName: { type: String, required: true }, // Denormalize
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  accountDetails: { type: BankDetailsSchema, required: true }, // Embed bank details
  requestDate: { type: Date, required: true },
  processedDate: { type: Date },
  transactionId: { type: String, ref: 'Transaction' }, // Link to the completed withdrawal transaction by its frontend 'id' (uuid string)
  remarks: { type: String }
});

// Order Schema
const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true }, // Frontend generated uuid
  userId: { type: String, required: true, ref: 'User' }, // User ID (uuid string)
  productId: { type: String, required: true }, // Or ref to Product if you create a Product model
  amount: { type: Number, required: true }, // Amount in paise
  currency: { type: String, required: true },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String }, // Razorpay Order ID
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
});

// Stored File Schema (for base64 files like KYC docs)
const StoredFileSchema = new Schema({
  id: { type: String, required: true, unique: true }, // Frontend generated uuid
  userId: { type: String, required: true, ref: 'User' }, // User ID (uuid string)
  storageKey: { type: String, required: true }, // Key indicating file type ('kyc_id_proof_files', etc.)
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  lastModified: { type: Number }, // Unix timestamp
  base64: { type: String, required: true }, // Base64 content (can be large!)
  uploadDate: { type: Date, required: true }
});

const AdminSchema = new Schema({
  username: String,
  password: String
})

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // UUID from frontend
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Price in paise (e.g., ₹199 = 19900)
  description: { type: String },
  commissionRate: { type: Number, default: 0 }, // Optional commission %
  active: { type: Boolean, default: true },
  createdDate: { type: Date, required: true } // ISO string from frontend
});


// --- Create Mongoose Models ---

export const UserModel = mongoose.model('User', UserSchema);
export const TransactionModel = mongoose.model('Transaction', TransactionSchema);
export const NetworkMemberNodeModel = mongoose.model('NetworkMemberNode', NetworkMemberNodeSchema);
export const NetworkStatsModel = mongoose.model('NetworkStats', NetworkStatsSchema);
export const DashboardStatsModel = mongoose.model('DashboardStats', DashboardStatsSchema);
export const WalletModel = mongoose.model('Wallet', WalletSchema);
export const CommissionStructureModel = mongoose.model('CommissionStructure', CommissionStructureSchema);
export const KycRequestModel = mongoose.model('KycRequest', KycRequestSchema);
export const WithdrawalRequestModel = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
export const OrderModel = mongoose.model('Order', OrderSchema);
export const FileModel = mongoose.model('File', StoredFileSchema);
export const AdminModel = mongoose.model('Admin', AdminSchema);
export const ProductModel = mongoose.model('Product', ProductSchema);

// Settings collection for single configuration documents like adminAuth
// This is accessed directly in controllers for simplicity
// const SettingsSchema = new Schema({ _id: { type: String, required: true }, value: { type: Schema.Types.Mixed } });
// export const SettingsModel = mongoose.model('Settings', SettingsSchema);