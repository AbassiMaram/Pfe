const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Fonction de calcul de niveau
const calculateLevel = (points) => {
  if (points >= 50000) return "Légende";
  if (points >= 15000) return "Expert";
  if (points >= 5000) return "Aventurier";
  if (points >= 1000) return "Explorateur";
  return "Initié";
};

// Fonction pour créer un utilisateur de test si nécessaire
const createTestUserIfNeeded = async (userId) => {
  if (userId === "test_user_id" || !mongoose.Types.ObjectId.isValid(userId)) {
    // Créer ou récupérer un utilisateur de test
    let testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      testUser = await User.create({
        nom: "Utilisateur Test",
        email: "test@example.com",
        password: "test123", // Hash this in production
        loyaltyPoints: 150,
        purchaseCount: 5
      });
      console.log("✅ Utilisateur de test créé:", testUser._id);
    }
    return testUser;
  }
  return null;
};

// Fonction pour créer une commande de test si nécessaire
const createTestOrderIfNeeded = async (orderId, userId) => {
  if (orderId === "test_order_id" || !mongoose.Types.ObjectId.isValid(orderId)) {
    // Créer une commande de test
    const testOrder = await Order.create({
      userId: userId,
      totalAmount: 100,
      scanned: false,
      createdAt: new Date()
    });
    console.log("✅ Commande de test créée:", testOrder._id);
    return testOrder;
  }
  return null;
};

// 1. Route pour récupérer les points de fidélité
router.get('/points/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        res.json({
            points: user.loyaltyPoints,
            level: calculateLevel(user.loyaltyPoints),
            purchases: user.purchaseCount
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 2. Route pour scanner un QR code
router.post("/scan", authMiddleware, async (req, res) => {
  try {
    let { userId, orderId } = req.body;
    
    console.log("📱 Tentative de scan:", { userId, orderId });

    // Gérer les utilisateurs de test
    const testUser = await createTestUserIfNeeded(userId);
    if (testUser) {
      userId = testUser._id;
    }

    // Gérer les commandes de test
    const testOrder = await createTestOrderIfNeeded(orderId, userId);
    if (testOrder) {
      orderId = testOrder._id;
    }

    // Validation des IDs pour les vrais utilisateurs/commandes
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "ID commande invalide"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId,
      scanned: { $ne: true }
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Commande invalide ou déjà scannée"
      });
    }

    const pointsToAdd = Math.round(order.totalAmount * 0.1);

    // Mise à jour sans transaction
    await Order.updateOne(
      { _id: orderId },
      { $set: { scanned: true } }
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          loyaltyPoints: pointsToAdd,
          purchaseCount: 1
        }
      },
      { new: true }
    );

    console.log("✅ Scan réussi:", {
      pointsAdded: pointsToAdd,
      totalPoints: updatedUser.loyaltyPoints
    });

    res.json({
      success: true,
      pointsAdded: pointsToAdd,
      totalPoints: updatedUser.loyaltyPoints,
      newLevel: calculateLevel(updatedUser.loyaltyPoints)
    });

  } catch (error) {
    console.error("Erreur scan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// 3. Route existante
router.get("/loyalty", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("loyaltyPoints");

    res.json({
      success: true,
      points: user.loyaltyPoints,
      level: calculateLevel(user.loyaltyPoints)
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;