const User = require("../models/User");

// Récupérer les points de fidélité pour l'utilisateur connecté
exports.getLoyaltyPoints = async (req, res) => {
  try {
    // Vérifiez que l'utilisateur est authentifié
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Non autorisé. Utilisateur non authentifié." });
    }

    const userId = req.user.userId;

    // Recherchez l'utilisateur par son ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Retournez les points de fidélité
    res.status(200).json({ loyaltyPoints: user.loyaltyPoints || 0 });
  } catch (error) {
    console.error("Erreur lors de la récupération des points de fidélité :", error.message);
    res.status(500).json({ message: "Erreur interne. Réessayez plus tard." });
  }
};

