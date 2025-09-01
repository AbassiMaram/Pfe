const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  changeType: {
    type: String,
    enum: ["sale", "restock", "adjustment"],
    required: true
  },
  quantity: {
    type: Number,
    required: true // Positif pour réapprovisionnement, négatif pour vente ou ajustement
  },
  stockAfter: {
    type: Number,
    required: true // Stock après la modification
  },
  reason: {
    type: String // Optionnel, ex. "Commande #123"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

module.exports = StockHistory;