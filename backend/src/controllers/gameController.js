const Game = require("../models/Game");
const Product = require("../models/Product");
const mongoose = require("mongoose");
class GameController {
  static async startGame(req, res) {
    try {
      if (!req.user || !req.user.userId) { // Changé de req.user._id à req.user.userId
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      const userId = req.user.userId; // Utilise userId au lieu de _id

      // Récupérer des produits avec gestion des cas vides
      const products = await Product.find().limit(5);
      console.log("Produits récupérés :", products); // Log pour débogage
      if (!products || products.length === 0) {
        return res.status(404).json({ message: "Aucun produit disponible pour le jeu. Ajoutez des produits dans la base de données." });
      }

      const product = products[Math.floor(Math.random() * products.length)];
      const hints = [
        `Un objet ${product.category || "inconnu"}`,
        `Utilisé pour : ${product.description || "usage varié"}`, // Supprimé 'color' car absent dans le schéma
      ];
      const options = [
        product.name,
        `Faux Trésor ${Math.floor(Math.random() * 100)}`,
        `Pièce Mystérieuse ${Math.floor(Math.random() * 100)}`,
        `Coffre Vide ${Math.floor(Math.random() * 100)}`,
      ].sort(() => Math.random() - 0.5);

      const question = {
        _id: new mongoose.Types.ObjectId(),
        hints,
        options,
        correctAnswer: product.name,
      };

      const game = new Game({ userId, question });
      await game.save();
      console.log("Jeu créé avec succès :", game); // Log pour confirmation

      res.status(200).json({ question });
    } catch (error) {
      console.error("Erreur détaillée dans startGame :", error); // Log détaillé de l'erreur
      res.status(500).json({ message: "Erreur lors du démarrage du jeu", error: error.message });
    }
  }

  static async submitAnswer(req, res) {
    try {
      const { questionId, answer } = req.body;
      const game = await Game.findOne({ "question._id": questionId, userId: req.user.userId }); // Changé de req.user._id à req.user.userId

      if (!game) {
        return res.status(404).json({ message: "Jeu non trouvé" });
      }

      const isCorrect = game.question.correctAnswer === answer;
      let newQuestion = null;

      if (isCorrect) {
        game.score += 10;
        const products = await Product.find().limit(5);
        if (!products || products.length === 0) {
          return res.status(404).json({ message: "Aucun produit disponible pour la prochaine question" });
        }
        const product = products[Math.floor(Math.random() * products.length)];
        const hints = [
          `Un objet ${product.category || "inconnu"}`,
          `Utilisé pour : ${product.description || "usage varié"}`, // Supprimé 'color'
        ];
        const options = [
          product.name,
          `Faux Trésor ${Math.floor(Math.random() * 100)}`,
          `Pièce Mystérieuse ${Math.floor(Math.random() * 100)}`,
          `Coffre Vide ${Math.floor(Math.random() * 100)}`,
        ].sort(() => Math.random() - 0.5);

        newQuestion = {
          _id: new mongoose.Types.ObjectId(),
          hints,
          options,
          correctAnswer: product.name,
        };
        game.question = newQuestion;
      }

      await game.save();
      res.status(200).json({ correct: isCorrect, newQuestion, score: game.score });
    } catch (error) {
      console.error("Erreur dans submitAnswer :", error);
      res.status(500).json({ message: "Erreur lors de la soumission", error: error.message });
    }
  }
}

module.exports = GameController;