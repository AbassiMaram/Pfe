const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const QRCode = require("qrcode"); 
const Shop = require("../models/Shop");
const { generateReferralCode } = require("../helpers/referralHelper");

// Middleware admin spécifique
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }
  next();
};

// 1. Route existante - Profil utilisateur connecté
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.status(200).json({ userId: user._id, username: user.nom });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// 2. Nouvelle route GET /users/:userId
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('nom email loyaltyPoints purchaseCount uniquePurchaseMonths successfulReferrals loyaltyLevel qrCode');
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      userId: user._id,
      nom: user.nom,
      email: user.email,
      loyaltyPoints: user.loyaltyPoints || 0,
      purchaseCount: user.purchaseCount || 0,
      uniquePurchaseMonths: user.uniquePurchaseMonths || 0,
      successfulReferrals: user.successfulReferrals || 0,
      loyaltyLevel: user.loyaltyLevel || "Initié",
      qrCode: user.qrCode
    });
  } catch (error) {
    console.error("Erreur getUser:", error);
    res.status(500).json({ 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Liste des marchands
router.get("/marchands/list", authMiddleware, isAdmin, async (req, res) => {
  try {
    const marchands = await User.find(
      { role: "marchand" },
      'nom email merchantId isActive lastLogin'
    );
    res.json(marchands);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 4. Liste des clients
router.get("/clients/list", authMiddleware, isAdmin, async (req, res) => {
  try {
    const clients = await User.find(
      { role: "client" },
      'nom email referralCode isActive lastLogin loyaltyPoints'
    );
    res.json(clients);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 5. Historique client
router.get("/admin/client-orders/:userId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const orders = await Order.find({ 
      $or: [
        { userId: userId },
        { userId: new mongoose.Types.ObjectId(userId) }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('items.productId', 'name category price');

    const enrichedOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item.toObject(),
        name: item.productId?.name || 'Produit supprimé',
        category: item.category || item.productId?.category || 'Non défini'
      }))
    }));

    res.status(200).json({ 
      orders: enrichedOrders,
      total: enrichedOrders.length
    });
  } catch (error) {
    console.error("Erreur getClientOrders:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
});

// 6. Créer un utilisateur
router.post("/create", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { nom, email, motDePasse, role = "client", referralCode } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }

    if (!["client", "marchand"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    let merchantId = null;
    if (role === "marchand") {
      const domainParts = email.split('@');
      if (domainParts.length !== 2) {
        return res.status(400).json({ message: "Email invalide pour un marchand" });
      }
      merchantId = domainParts[1].split('.')[0];
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newUser = new User({
      nom,
      email,
      motDePasse: hashedPassword,
      role,
      isActive: true,
      merchantId: role === "marchand" ? merchantId : null,
      referralCode: await generateReferralCode(nom),
      qrCode: ""
    });

    newUser.qrCode = await QRCode.toDataURL(newUser._id.toString());
    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role} créé avec succès`,
      user: {
        _id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        boutique: merchantId,
        merchantId: newUser.merchantId
      }
    });
  } catch (error) {
    console.error("Erreur création:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

// 7. Supprimer un utilisateur
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    const roleMessage = {
      'client': 'Client supprimé avec succès',
      'marchand': 'Marchand supprimé avec succès',
      'admin': 'Administrateur supprimé avec succès'
    };
    
    res.json({ 
      message: roleMessage[user.role] || 'Utilisateur supprimé avec succès',
      deletedUserId: user._id
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 8. Activer/désactiver un utilisateur
router.put("/:id/toggle-active", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `${user.role} ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 9. Modifier un utilisateur
router.put("/:id/update", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, motDePasse, isActive, loyaltyPoints } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const updates = {};
    if (nom) updates.nom = nom;
    if (email) updates.email = email;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (loyaltyPoints) updates.loyaltyPoints = loyaltyPoints;

    if (motDePasse) {
      updates.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    if (email && user.role === 'marchand') {
      const domainParts = email.split('@');
      if (domainParts.length === 2) {
        updates.merchantId = domainParts[1].split('.')[0];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    res.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erreur modification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Dashboard stats route
router.get('/dashboard/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsers24h,
      totalMerchants,
      activeMerchants,
      totalOrders,
      revenueResult,
      totalShops
    ] = await Promise.all([
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "client", isActive: true }),
      User.countDocuments({ 
        role: "client", 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({ role: "marchand" }),
      User.countDocuments({ role: "marchand", isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { 
          $match: { 
            totalAmount: { $exists: true, $type: "number", $gt: 0 }
          }
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: "$totalAmount" }
          }
        }
      ]),
      Shop.countDocuments()
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: newUsers24h
        },
        merchants: {
          total: totalMerchants,
          active: activeMerchants,
          shops: totalShops
        },
        orders: {
          total: totalOrders,
        },
        revenue: {
          total: parseFloat(totalRevenue.toFixed(2)),
          currency: "TND"
        }
      }
    });
  } catch (error) {
    console.error("Erreur dashboard stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;