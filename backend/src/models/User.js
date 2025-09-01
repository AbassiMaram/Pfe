const mongoose = require("mongoose");
const Order = require("../models/Order");

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  motDePasse: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["client", "marchand", "admin"],
    default: "client",
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // ✅ Permet les valeurs null/undefined
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralValidated: {
    type: Boolean,
    default: false,
  },
  referralRewards: [{
    filleulId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  qrCode: {
    type: String,
  },
  totalScans: {
    type: Number,
    default: 0,
  },
  // ✅ Suppression de unique: true des éléments du tableau
  scannedQrCodes: [{
    type: String,
    // unique: true supprimé
  }],
  scanDates: [{
    type: String,
    // unique: true supprimé
  }],
  visitedScreens: [{
    type: String,
    // unique: true supprimé
  }],
  badgesEarned: {
    "Premier Pas": {
      type: Boolean,
      default: false,
    },
    "Scanneur Assidu": {
      type: Boolean,
      default: false,
    },
    "Utilisateur Quotidien": {
      type: Boolean,
      default: false,
    },
    "Explorateur": {
      type: Boolean,
      default: false,
    },
    "Marathonien": {
      type: Boolean,
      default: false,
    },
  },
  notifications: [{
    id: {
      type: Number,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },
  merchantId: {
    type: String,
    default: null,
  },
  loyaltyLevel: {
    type: String,
    enum: ["Découvreur", "Initié", "Fidèle", "VIP", "Ambassadeur"],
    default: "Découvreur",
  },
  loyaltyProgress: {
    totalPoints: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    uniquePurchaseMonths: {
      type: Number,
      default: 0,
    },
    lastLevelUpdate: {
      type: Date,
      default: Date.now,
    },
    merchantLoyalty: [{
      merchantId: { type: String, required: true },
      purchaseCount: { type: Number, default: 0 },
      loyaltyLevel: {
        type: String,
        enum: ["Bronze", "Argent", "Or"],
        default: "Bronze",
      },
      lastOrderDate: { type: Date },
    }],
  },
  lastPointsActivity: {
    type: Date,
    default: null,
  },
  adminPermissions: {
    type: [String],
    default: [],
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// ✅ Index composés pour éviter les doublons (optionnel)
// Si vous voulez maintenir l'unicité, utilisez des index composés

module.exports = mongoose.model("User", userSchema);