const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const authMiddleware = require("../middleware/authMiddleware");

// Middleware admin simplifié
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès admin requis" });
  }
  next();
};

// Routes de base qui fonctionnent
router.post("/shops", shopController.createShop);
router.get("/", shopController.getShops);
router.get("/shop", shopController.getShops);
router.get("/by-merchant", shopController.getShopByMerchantId);
router.get("/:id", shopController.getShopById);
router.put("/shops/:id", shopController.updateShop);
router.delete("/shops/:id", shopController.deleteShop);

// Routes admin sécurisées (ajoutez-les une par une après avoir testé que les bases fonctionnent)
router.post("/admin/shops", authMiddleware, isAdmin, shopController.createShop);
router.get("/admin/shops", authMiddleware, isAdmin, shopController.getShops);
router.get("/admin/shops/by-merchant", authMiddleware, isAdmin, shopController.getShopByMerchantId);
router.get("/admin/shops/:id", authMiddleware, isAdmin, shopController.getShopById);
router.put("/admin/shops/:id", authMiddleware, isAdmin, shopController.updateShop);
router.delete("/admin/shops/:id", authMiddleware, isAdmin, shopController.deleteShop);

module.exports = router;