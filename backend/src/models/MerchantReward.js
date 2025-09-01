// C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/src/models/MerchantReward.js
const mongoose = require("mongoose");

const merchantRewardSchema = new mongoose.Schema({
  merchantId: { type: String, required: true },
  type: { type: String, required: true }, // "promotion" ou "specialOffer"
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: function () { return this.type === "promotion"; } },
  discountValue: { type: Number, required: function () { return this.type === "promotion"; } },
  specialOffer: { type: String, required: function () { return this.type === "specialOffer"; } },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

module.exports = mongoose.model("MerchantReward", merchantRewardSchema);