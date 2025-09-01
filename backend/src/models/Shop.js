// C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/src/models/Shop.js
const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nom de la boutique
  description: { type: String }, // Description
  category: { type: String, required: true }, // Catégorie (Vêtements, Restaurants, etc.)
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Produits associés
  imageUrl: { type: String }, // URL de l'image de la boutique
  merchantId: { type: String, required: true }, // Lien vers Merchant
  contact: {
    // Nouveau champ pour les informations de contact
    email: { type: String }, // Email de contact
    phone: { type: String }, // Numéro de téléphone
    address: { type: String }, // Adresse physique (facultatif)
  },
});

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;