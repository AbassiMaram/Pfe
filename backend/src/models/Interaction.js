// C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/models/Interaction.js
const mongoose = require("mongoose");

const InteractionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["like", "review", "visit"], 
    required: true 
  },
  pageUrl: { type: String, default: null },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: "targetType" // Référence dynamique à Product ou Shop
  },
  targetType: { 
    type: String, 
    enum: ["Product", "Shop"], 
    required: true 
  },
  value: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: null 
  }, // Pour review : 1-5 étoiles ; pour like : 1 ; visite : null
  comment: { 
    type: String, 
    default: null 
  }, // Commentaire optionnel pour les avis
  sentiment: { 
    type: String, 
    enum: ["positif", "neutre", "négatif"], 
    default: "neutre" 
  }, // Nouveau champ pour stocker le sentiment
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
  
});

module.exports = mongoose.model("Interaction", InteractionSchema);