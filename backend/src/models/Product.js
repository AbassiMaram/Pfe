const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nom du produit
  price: { type: Number, required: true }, // Prix du produit
  description: { type: String }, // Description du produit
  imageUrl: { type: String }, // URL de l'image du produit
  stock: { type: Number, default: 0 }, // Quantité disponible
  category: { type: String }, // Catégorie du produit
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true }, // Référence à la boutique
  quantity: { type: Number, default: 0 },
   
premiumAccess: { type: Boolean, default: false },
  premiumPaymentDate: { type: Date },
  premiumPaymentIntentId: { type: String },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
