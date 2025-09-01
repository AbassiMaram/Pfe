const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true }, // Ex. "zara"
  name: { type: String, required: true }, // Nom de la boutique
  address: { type: String },
  categories: [{ type: String }], // Ex. ["Vêtements", "Accessoires"]
  pointsConfig: {
    multipliers: { type: Map, of: Number, default: () => new Map() }, // Ex. { "Électronique": 2 }
    enabled: { type: Boolean, default: true }, // Programme fidélité actif ou non
  },
  defaultLiquidationDiscount: { type: Number, default: 30 }, // Pourcentage par défaut pour liquidation (0-100)
  defaultPromotionDiscount: { type: Number, default: 20 }, // Pourcentage par défaut pour promotions (0-100)
  stripePaymentMethodId: String,
  paymentMethodSetupDate: Date
});

module.exports = mongoose.model("Merchant", merchantSchema);