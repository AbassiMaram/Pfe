const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.post("/add", cartController.addToCart); // Ajouter un produit au panier
router.get("/", cartController.getCart); // Récupérer le panier
router.delete("/remove", cartController.removeFromCart); // Supprimer un produit du panier

module.exports = router;
