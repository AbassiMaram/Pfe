const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charger les variables d'environnement

module.exports = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("❌ Aucun token fourni.");
    return res.status(401).json({ message: "Accès refusé !" });
  }

  try {
    console.log("✅ Token reçu :", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret"); // Valider avec la clé secrète centralisée
    console.log("✅ Token décodé :", decoded);
    req.user = decoded; // Ajouter les données décodées à la requête
    next(); // Passer au middleware suivant
  } catch (error) {
    console.error("❌ Erreur de validation du token :", error.message);
    res.status(401).json({ message: "Token invalide !" });
  }
};
