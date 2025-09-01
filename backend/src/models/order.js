const mongoose = require("mongoose");
const User = require('./User');
const OrderSchema = new mongoose.Schema({
  userId: {
    type: String, // Changé de ObjectId à String pour plus de flexibilité
    required: true,
    validate: {
      validator: function(v) {
        // Valide si c'est un ObjectId (24 caractères hexadécimaux) ou une chaîne non vide
        return mongoose.Types.ObjectId.isValid(v) || (typeof v === 'string' && v.trim().length > 0);
      },
      message: props => `${props.value} n'est pas un userId valide ! Doit être un ObjectId ou une chaîne non vide.`
    },
    ref: "User" // Garde la référence pour les populate si besoin
  },
  merchantId: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      category: { type: String, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  loyaltyPoints: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  shippingAddress: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

// Option pour convertir automatiquement les chaînes valides en ObjectId si possible
OrderSchema.pre('save', function(next) {
  if (mongoose.Types.ObjectId.isValid(this.userId)) {
    this.userId = new mongoose.Types.ObjectId(this.userId);
  }
  next();
});


module.exports = mongoose.model("Order", OrderSchema);