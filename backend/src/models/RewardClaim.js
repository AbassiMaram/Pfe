// C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/src/models/RewardClaim.js
const mongoose = require("mongoose");

const rewardClaimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "MerchantReward", required: true },
  merchantId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "validated", "expired"],
    default: "pending",
  },
  claimedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RewardClaim", rewardClaimSchema);