const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken"); // AJOUT MANQUANT
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const User = require("../models/User");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Middleware admin amélioré
const isAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "") || req.query.token;
  
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    // Solution directe - Utilisation d'une clé fixe identique à votre auth middleware
    const decoded = jwt.verify(token, "secret"); 
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Accès admin requis" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};

// Routes de base
router.post("/create-payment-intent-public", orderController.createPaymentIntent);
router.post("/create-payment-intent", authMiddleware, orderController.createPaymentIntent);
router.post("/confirm", authMiddleware, orderController.confirmOrder);
router.get("/", orderController.getAllOrders);
router.get("/last-order", orderController.getLastOrder);
router.get("/order/:orderId", orderController.getOrderById);
router.get("/orders/by-country", orderController.getOrdersByCountry);
router.get("/orders/recent", authMiddleware, orderController.getRecentOrders);
router.get("/frequency-by-client-shop", authMiddleware, orderController.getOrderFrequencyByClientShop);

// Route analytics corrigée avec validation ObjectId
router.get("/analytics", async (req, res) => {
   try {
    const { range = "month" } = req.query;
    const validRanges = ["week", "month", "quarter", "year"];
    
    if (!validRanges.includes(range)) {
      return res.status(400).json({ 
        success: false, 
        message: `Période invalide. Utilisez: ${validRanges.join(", ")}` 
      });
    }

    // Calcul de la période
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setDate(now.getDate() - 30);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        startDate.setDate(1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setMonth(now.getMonth());
        startDate.setDate(now.getDate());
        break;
    }

    // Agrégations en parallèle
    const [
      revenueData, 
      customersData,
      topMerchants,
      ordersByMerchant,
      topProducts
    ] = await Promise.all([
      // Revenus par date
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            totalAmount: { $exists: true, $gt: 0 }
          }
        },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
            total: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 }},
        { $project: { date: "$_id", total: 1, _id: 0 }}
      ]),
      
      // Nouveaux clients
      User.aggregate([
        { $match: { role: "client", createdAt: { $gte: startDate } }},
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 }},
        { $project: { date: "$_id", count: 1, _id: 0 }}
      ]),
      
      // Top marchands (par chiffre d'affaires)
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            merchantId: { $exists: true, $ne: null },
            totalAmount: { $gt: 0 }
          }
        },
        { $group: {
          _id: "$merchantId",
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }},
        { $sort: { totalSales: -1 }},
        { $limit: 5 },
        { $project: { merchantId: "$_id", totalSales: 1, orderCount: 1, _id: 0 }}
      ]),
      
      // Commandes par marchand
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            merchantId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: "$merchantId",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 }},
        { $limit: 5 }
      ]),
      
      // Top produits
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            "items.quantity": { $gt: 0 }
          }
        },
        { $unwind: "$items" },
        { 
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" }
          }
        },
        { $sort: { totalQuantity: -1 }},
        { $limit: 5 }
      ])
    ]);

    // Récupération des noms avec validation ObjectId
    const [merchantsWithNames, shopsWithNames, productsWithNames] = await Promise.all([
      // Noms des marchands avec validation ObjectId
      Promise.all(topMerchants.map(async m => {
        try {
          // Vérifier si merchantId est un ObjectId valide
          if (!mongoose.Types.ObjectId.isValid(m.merchantId)) {
            console.warn(`MerchantId invalide: ${m.merchantId}`);
            return {
              ...m,
              merchantName: `Marchand ${m.merchantId}`
            };
          }
          
          const merchant = await User.findById(m.merchantId);
          return {
            ...m,
            merchantName: merchant?.name || merchant?.nom || `Marchand ${m.merchantId}`
          };
        } catch (err) {
          console.error(`Erreur chargement marchand ${m.merchantId}:`, err);
          return {
            ...m,
            merchantName: `Marchand ${m.merchantId}`
          };
        }
      })),
      
      // Noms des boutiques avec validation ObjectId
      Promise.all(ordersByMerchant.map(async m => {
        try {
          // Vérifier si merchantId est un ObjectId valide
          if (!mongoose.Types.ObjectId.isValid(m._id)) {
            console.warn(`MerchantId invalide pour boutique: ${m._id}`);
            return {
              merchantId: m._id,
              count: m.count,
              shopName: `Boutique ${m._id}`
            };
          }
          
          const shop = await Shop.findOne({ merchantId: m._id });
          return {
            merchantId: m._id,
            count: m.count,
            shopName: shop?.name || `Boutique ${m._id.toString().substring(0, 6)}...`
          };
        } catch (err) {
          console.error(`Erreur traitement boutique ${m._id}:`, err);
          return {
            merchantId: m._id,
            count: m.count,
            shopName: "Nom inconnu"
          };
        }
      })),
      
      // Noms des produits avec validation ObjectId
      Promise.all(topProducts.map(async p => {
        try {
          // Vérifier si productId est un ObjectId valide
          if (!mongoose.Types.ObjectId.isValid(p._id)) {
            console.warn(`ProductId invalide: ${p._id}`);
            return {
              productId: p._id,
              totalQuantity: p.totalQuantity,
              productName: `Produit ${p._id}`
            };
          }
          
          const product = await Product.findById(p._id);
          return {
            productId: p._id,
            totalQuantity: p.totalQuantity,
            productName: product?.name || `Produit ${p._id.toString().substring(0, 6)}...`
          };
        } catch (err) {
          console.error(`Erreur chargement produit ${p._id}:`, err);
          return {
            productId: p._id,
            totalQuantity: p.totalQuantity,
            productName: `Produit ${p._id.toString().substring(0, 6)}...`
          };
        }
      }))
    ]);

    res.json({
      success: true,
      data: {
        revenueData: revenueData || [],
        customersData: customersData || [],
        topMerchants: merchantsWithNames || [],
        ordersByShop: shopsWithNames || [],
        topProducts: productsWithNames || []
      }
    });

  } catch (error) {
    console.error("Erreur analytics:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Route export corrigée avec meilleure gestion des erreurs
router.get("/export", isAdmin, async (req, res) => {
  try {
    const { format = "csv" } = req.query;
    
    if (format !== "csv") {
      return res.status(400).json({
        success: false,
        message: "Seul le format CSV est supporté"
      });
    }

    console.log("Début export CSV..."); // Debug

    // Récupération de toutes les commandes
    const orders = await Order.find({})
      .populate("userId", "nom email name")
      .populate("merchantId", "nom name")
      .populate("items.productId", "name price")
      .lean(); // Optimisation

    console.log(`Nombre de commandes trouvées: ${orders.length}`); // Debug

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune commande trouvée"
      });
    }

    // Génération CSV avec gestion des erreurs
    const csvHeader = "ID,Date,Client,Marchand,Total,Produits\n";
    const csvRows = orders.map(order => {
      try {
        const products = order.items?.map(item => {
          const productName = item.productId?.name || 'Produit inconnu';
          const quantity = item.quantity || 0;
          return `${productName} (${quantity}x)`;
        }).join("; ") || 'Aucun produit';
        
        const clientName = order.userId?.nom || order.userId?.name || 'Client anonyme';
        const merchantName = order.merchantId?.nom || order.merchantId?.name || 'Marchand inconnu';
        const total = order.totalAmount || 0;
        const date = order.createdAt ? new Date(order.createdAt).toISOString() : 'Date inconnue';
        
        return [
          `"${order._id}"`,
          `"${date}"`,
          `"${clientName}"`,
          `"${merchantName}"`,
          `"${total}"`,
          `"${products}"`
        ].join(",");
      } catch (itemError) {
        console.error("Erreur traitement commande:", itemError);
        return `"${order._id}","Erreur","Erreur","Erreur","0","Erreur"`;
      }
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    // Configuration des headers avec CORS amélioré
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="commandes-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Headers CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("Export CSV terminé avec succès"); // Debug
    res.send(csvContent);

  } catch (error) {
    console.error("Erreur export détaillée:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      headers: req.headers
    });
    
    res.status(500).json({
      success: false,
      message: "Échec de l'export",
      error: process.env.NODE_ENV === "development" ? error.message : "Erreur serveur interne"
    });
  }
});


module.exports = router;