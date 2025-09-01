const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Shop = require("../models/Shop");

const authMiddleware = require("../middleware/authMiddleware");

// Nettoie les clés 'amp;' dans les params query
function cleanQueryParams(query) {
  const cleaned = {};
  for (const [key, value] of Object.entries(query)) {
    const cleanKey = key.startsWith("amp;") ? key.substring(4) : key;
    cleaned[cleanKey] = value;
  }
  return cleaned;
}

// Extraction fiable des paramètres productId, shopId, since
function extractParams(req) {
  const rawQuery = req.query;
  const cleanedQuery = cleanQueryParams(rawQuery);
  const productId =
    cleanedQuery.productId ||
    cleanedQuery.productid ||
    rawQuery.productId ||
    rawQuery.productid;
  const shopId =
    cleanedQuery.shopId ||
    cleanedQuery.shopid ||
    rawQuery.shopId ||
    rawQuery.shopid ||
    rawQuery["amp;shopId"] ||
    rawQuery["amp;shopid"];
  const since = cleanedQuery.since || rawQuery.since;
  return { productId, shopId, since, cleanedQuery };
}

// ----- ROUTES -----

// Route publique GET /history/public
router.get("/history/public", async (req, res) => {
  console.log("=== GET /api/stock/history/public ===");
  try {
    const { productId, shopId, since, cleanedQuery } = extractParams(req);

    if (!productId || !shopId) {
      return res.status(400).json({
        message: "productId et shopId sont requis",
        debug: { productId, shopId, originalQuery: req.query, cleanedQuery },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId invalide" });
    }
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "shopId invalide" });
    }

    const query = {
  productId: new mongoose.Types.ObjectId(productId),
  shopId: new mongoose.Types.ObjectId(shopId),
};

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        query.createdAt = { $gte: sinceDate };
      }
    }

    const history = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .populate("productId", "name sku")
      .populate("shopId", "name")
      .lean();

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Erreur GET /history/public:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// Middleware d’authentification pour les routes privées
router.use(authMiddleware);

// Route privée POST /adjust (ajustement stock)
router.post("/adjust", async (req, res) => {
  try {
    const { productId, quantity, changeType, reason } = req.body;
    const merchantId = req.user.merchantId;

    if (!productId || quantity == null || !changeType) {
      return res
        .status(400)
        .json({ message: "productId, quantity et changeType sont requis" });
    }

    // Convertir quantity en nombre
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum)) {
      return res.status(400).json({ message: "quantity doit être un nombre" });
    }

    // Trouver la boutique liée au marchand (merchant)
    const shop = await Shop.findOne({ merchantId });
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée pour ce marchand" });
    }
    const shopId = shop._id;

    // Trouver le produit dans cette boutique
    const product = await Product.findOne({ _id: productId, shopId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Produit non trouvé pour cette boutique" });
    }

    // Mise à jour du stock
    const newStock = product.stock + qtyNum;
    if (newStock < 0) {
      return res.status(400).json({ message: "Le stock ne peut pas être négatif" });
    }
    product.stock = newStock;
    await product.save();

    // Enregistrement historique stock
    const stockHistory = new StockHistory({
      productId: product._id,
      shopId: shopId,
      changeType,
      quantity: qtyNum,
      stockAfter: product.stock,
      reason,
    });
    await stockHistory.save();

    res.status(200).json({ message: "Stock mis à jour", stockHistory });
  } catch (error) {
    console.error("Erreur POST /adjust:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// Route privée GET /history (historique stock avec auth)
router.get("/history", async (req, res) => {
  try {
    const { productId, shopId, since, cleanedQuery } = extractParams(req);

    if (!productId || !shopId) {
      return res.status(400).json({
        message: "productId et shopId sont requis",
        debug: { productId, shopId, originalQuery: req.query, cleanedQuery },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId invalide" });
    }
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "shopId invalide" });
    }

   const query = {
  productId: new mongoose.Types.ObjectId(productId),
  shopId: new mongoose.Types.ObjectId(shopId),
};

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        query.createdAt = { $gte: sinceDate };
      }
    }

    const history = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .populate("productId", "name sku")
      .populate("shopId", "name")
      .lean();

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Erreur GET /history:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
