const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Order = require("../models/Order");
const Reward = require("../models/Reward");
const RewardClaim = require("../models/RewardClaim");
const Merchant = require("../models/Merchant");
const Shop = require("../models/Shop");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const axios = require("axios");
const ObjectId = mongoose.Types.ObjectId;

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Erreur de configuration Nodemailer :", error);
  } else {
    console.log("Nodemailer est prêt à envoyer des emails");
  }
});

const getLoyalCustomers = async (req, res) => {
  try {
    const { merchantId, minPoints, minOrders, lastVisit } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    console.log("Recherche des commandes pour merchantId:", merchantId);
    const orders = await Order.find({ merchantId });
    console.log("Commandes trouvées:", orders.length);

    if (!orders.length) {
      return res.status(200).json({
        customers: [],
        stats: { totalCustomers: 0, totalPoints: 0, averagePoints: 0 },
      });
    }

    const userIds = [...new Set(orders
      .map((order) => order.userId?.toString())
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    )];
    console.log("userIds uniques extraits:", userIds.length, userIds);

    if (!userIds.length) {
      return res.status(200).json({
        customers: [],
        stats: { totalCustomers: 0, totalPoints: 0, averagePoints: 0 },
      });
    }

    const users = await User.find({ _id: { $in: userIds } });
    console.log("Utilisateurs trouvés:", users.length);

    let customers = userIds.map((userId) => {
      const user = users.find((u) => u._id.toString() === userId);
      const userOrders = orders.filter((order) => order.userId && order.userId.toString() === userId);
      
      if (!userOrders.length) {
        console.log(`Aucune commande valide pour userId: ${userId}`);
        return null;
      }

      // Calculer les points gagnés dans cette boutique uniquement
      const merchantLoyaltyPoints = userOrders.reduce((totalPoints, order) => {
        return totalPoints + (order.loyaltyPoints || 0);
      }, 0);

      const lastOrderDate = userOrders.reduce((latest, order) => {
        return new Date(order.createdAt) > new Date(latest) ? order.createdAt : latest;
      }, userOrders[0].createdAt);

      const daysSinceLastOrder = Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
      const orderFrequency = userOrders.length / 30;
      const frequencyVariation = 0;
      const averageOrderAmount = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / userOrders.length;
      const amountVariation = 0;
      const daysSinceLastPointsActivity = 999; // Valeur par défaut, car lastPointsActivity n'existe pas
      const notificationReadRate = user?.notificationReadRate || 0;

      return {
        userId,
        nom: user ? user.nom : "Utilisateur inconnu",
        loyaltyPoints: merchantLoyaltyPoints,
        orderCount: userOrders.length,
        lastOrderDate,
        features: {
          daysSinceLastOrder,
          orderFrequency,
          frequencyVariation,
          averageOrderAmount,
          amountVariation,
          daysSinceLastPointsActivity,
          notificationReadRate,
        },
      };
    }).filter(customer => customer !== null);

    console.log("Clients avant filtrage:", customers.length);

    // Calculer les stats avant filtrage pour totalCustomers
    const statsBeforeFilters = {
      totalCustomers: customers.length,
      totalPoints: customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0),
      averagePoints: customers.length ? customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0) / customers.length : 0,
    };

    // Appliquer les filtres
    if (minPoints) {
      customers = customers.filter((customer) => customer.loyaltyPoints >= Number(minPoints));
    }
    if (minOrders) {
      customers = customers.filter((customer) => customer.orderCount >= Number(minOrders));
    }
    if (lastVisit) {
      const filterDate = new Date(lastVisit);
      customers = customers.filter((customer) => new Date(customer.lastOrderDate) >= filterDate);
    }

    console.log("Clients après filtrage:", customers.length);

    const stats = {
      totalCustomers: statsBeforeFilters.totalCustomers,
      totalPoints: customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0),
      averagePoints: customers.length ? customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0) / customers.length : 0,
    };

    // Appeler l'API de prédiction de désengagement
    if (customers.length > 0) {
      const customerFeatures = customers.map(customer => customer.features);
      try {
        const response = await axios.post("http://localhost:5004/predict_disengagement", {
          customers: customerFeatures
        }, {
          timeout: 5000,
        });

        const predictions = response.data;
        console.log("Prédictions de désengagement:", predictions);

        customers = customers.map((customer, index) => ({
          ...customer,
          disengagementScore: predictions[index]?.disengagementScore || 0,
          status: predictions[index]?.status || "Inconnu",
        }));
      } catch (error) {
        console.error("Erreur lors de l'appel à /predict_disengagement:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        customers = customers.map(customer => ({
          ...customer,
          disengagementScore: 0,
          status: "Inconnu",
        }));
      }
    }

    res.status(200).json({ customers, stats });
  } catch (error) {
    console.error("Erreur getLoyalCustomers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const addPoints = async (req, res) => {
  try {
    const { merchantId, userId, points } = req.body;
    
    if (!merchantId || !userId || !points || points <= 0) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant || !merchant.pointsConfig?.enabled) {
      return res.status(400).json({ message: "Programme de points désactivé ou marchand non trouvé" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Points actuels de l'utilisateur
    const currentPoints = user.loyaltyPoints || 0;
    
    // Points à ajouter (SANS offre spéciale pour ajout manuel)
    const pointsToAdd = parseInt(points);
    
    // Calcul du nouveau total
    const newTotalPoints = currentPoints + pointsToAdd;
    
    // Mise à jour des points de l'utilisateur
    user.loyaltyPoints = newTotalPoints;
    await user.save();

    // Notification si seuil de 10000 points atteint
    if (currentPoints < 10000 && newTotalPoints >= 10000) {
      const notificationMessage = `Félicitations ${user.nom || "Client"} ! Vous avez atteint ${newTotalPoints} points de fidélité chez ${merchant.name || merchantId}. Profitez de vos avantages !`;
      
      const mailInfo = await transporter.sendMail({
        from: `"LoyaltyHub" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: "🎉 Vous avez atteint 10 000 points de fidélité !",
        text: notificationMessage,
        html: `<p>${notificationMessage}</p>`,
      });
      
      console.log(`Email envoyé à ${user.email} pour 10 000 points:`, {
        userId: user._id,
        message: notificationMessage,
        messageId: mailInfo.messageId,
      });
    }

    res.status(200).json({
      message: "Points ajoutés avec succès",
      pointsAdded: pointsToAdd,
      previousPoints: currentPoints,
      newTotalPoints: newTotalPoints,
      userId,
      note: "Ajout manuel - offres spéciales non appliquées"
    });

  } catch (error) {
    console.error("Erreur addPoints:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { merchantId, userId } = req.query;

    if (!merchantId || !userId) {
      return res.status(400).json({ message: "merchantId et userId requis" });
    }

    const orders = await Order.find({ merchantId, userId });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Erreur getOrderHistory:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};



const createReward = async (req, res) => {
  try {
    const { type, startDate, endDate, productIds, discountValue, discountValues, specialOffer, customOffer } = req.body;
    const merchantId = req.user.merchantId;

    if (!merchantId || !type || !startDate || !endDate) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
    }

    if (type === "promotion") {
      if (!Array.isArray(productIds) || productIds.length === 0 || !discountValue) {
        return res.status(400).json({ message: "Au moins un productId et discountValue sont requis" });
      }

      const createdRewards = [];
      
      for (let i = 0; i < productIds.length; i++) {
        const productId = new mongoose.Types.ObjectId(productIds[i]);
        
        // Récupérer le prix du produit pour calculer discountedPrice
        const product = await Product.findById(productId).select('price');
        if (!product) {
          return res.status(404).json({ message: `Produit avec ID ${productIds[i]} non trouvé` });
        }
        
        const originalPrice = product.price || 0;
        // CORRECTION: Utiliser discountValues[i] si disponible, sinon discountValue
        const discount = discountValues && discountValues[i] !== undefined ? parseFloat(discountValues[i]) : parseFloat(discountValue);
        const discountedPrice = originalPrice * (1 - discount / 100);

        const rewardData = {
          merchantId,
          type,
          startDate,
          endDate,
          productIds: [productId], // Chaque récompense est liée à un seul produit
          discountValue: discount, // CORRECTION: Utilise la réduction spécifique
          discountValues: [discount], // CORRECTION: Stocke la réduction spécifique pour cet item
          items: [{
            productId,
            quantity: 1,
            originalPrice,
            discount,
            category: "N/A",
            discountedPrice,
          }],
        };
        
        const reward = new Reward(rewardData);
        await reward.save();
        createdRewards.push(reward);
        console.log(`Récompense créée pour ${productIds[i]} avec réduction ${discount}%`);
      }
      
      return res.status(201).json({ message: "Récompenses créées", rewards: createdRewards });
    }
    
    // Logique pour specialOffer
    else if (type === "specialOffer") {
      if (!specialOffer || !specialOffer.type) {
        return res.status(400).json({ message: "specialOffer.type requis" });
      }
      if (!specialOffer.minPoints) {
        return res.status(400).json({ message: "specialOffer.minPoints requis" });
      }
      if (specialOffer.type === "multiplicationPoints" && !specialOffer.multiplier) {
        return res.status(400).json({ message: "specialOffer.multiplier requis" });
      }
      if (specialOffer.type === "buyOneGetOne" && (!specialOffer.buyProductId || !specialOffer.getProductId)) {
        return res.status(400).json({ message: "buyProductId et getProductId requis" });
      }
      
      const rewardData = { merchantId, type, startDate, endDate, specialOffer };
      const reward = new Reward(rewardData);
      await reward.save();
      return res.status(201).json({ message: "Récompense créée", reward });
    } 
    
    // Logique pour customOffer
    else if (type === "customOffer") {
      if (!customOffer || !customOffer.title || !customOffer.description) {
        return res.status(400).json({ message: "customOffer.title et description requis" });
      }
      
      const rewardData = { merchantId, type, startDate, endDate, customOffer };
      const reward = new Reward(rewardData);
      await reward.save();
      return res.status(201).json({ message: "Récompense créée", reward });
    }
    
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
const getRewards = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const rewards = await Reward.find({ merchantId });
    res.status(200).json({ rewards });
  } catch (error) {
    console.error("Erreur getRewards:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getRewardClaims = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const claims = await RewardClaim.find({ merchantId })
      .populate("userId")
      .populate("rewardId");
    res.status(200).json({ claims });
  } catch (error) {
    console.error("Erreur getRewardClaims:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updateRewardClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status } = req.body;

    if (!claimId || !["pending", "validated", "expired"].includes(status)) {
      return res.status(400).json({ message: "claimId ou statut invalide" });
    }

    const claim = await RewardClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Réclamation non trouvée" });
    }

    claim.status = status;
    await claim.save();

    res.status(200).json({ message: "Statut mis à jour", claim });
  } catch (error) {
    console.error("Erreur updateRewardClaimStatus:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getMerchantProfile = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: "Profil non trouvé" });
    }

    res.status(200).json({ merchant });
  } catch (error) {
    console.error("Erreur getMerchantProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updateMerchantProfile = async (req, res) => {
  try {
    const { merchantId, name, address, categories } = req.body;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const merchant = await Merchant.findOneAndUpdate(
      { merchantId },
      { name, address, categories },
      { new: true, upsert: true }
    );

    const updatedShop = await Shop.findOneAndUpdate(
      { merchantId },
      {
        name: name || merchant.name,
        description: address || merchant.address || "Pas de description",
        category: categories && categories.length > 0 ? categories[0] : "Non spécifié",
      },
      { new: true, upsert: false }
    );

    if (!updatedShop) {
      console.warn(`Aucune boutique Shop trouvée pour merchantId: ${merchantId}`);
      return res.status(200).json({
        message: "Profil Merchant mis à jour, mais aucune boutique Shop correspondante trouvée",
        merchant,
      });
    }

    console.log("Shop mis à jour :", updatedShop);
    res.status(200).json({ message: "Profil mis à jour", merchant, shop: updatedShop });
  } catch (error) {
    console.error("Erreur updateMerchantProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updatePointsConfig = async (req, res) => {
  try {
    const { merchantId, multipliers, enabled } = req.body;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const multipliersMap = new Map();
    if (multipliers && typeof multipliers === "object") {
      Object.entries(multipliers).forEach(([category, value]) => {
        const cleanCategory = category.trim();
        multipliersMap.set(cleanCategory, Number(value));
      });
    }

    const merchant = await Merchant.findOneAndUpdate(
      { merchantId },
      { pointsConfig: { multipliers: multipliersMap, enabled: enabled !== undefined ? enabled : true } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Configuration des points mise à jour", merchant });
  } catch (error) {
    console.error("Erreur updatePointsConfig:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getAllShops = async (req, res) => {
  try {
    const merchants = await Merchant.find();
    const shops = merchants.map((merchant) => ({
      _id: merchant.merchantId,
      name: merchant.name,
      description: merchant.address || "Pas de description",
      category: merchant.categories && merchant.categories.length > 0 ? merchant.categories[0] : "Non spécifié",
    }));
    res.status(200).json(shops);
  } catch (error) {
    console.error("Erreur getAllShops:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const logoutMerchant = async (req, res) => {
  try {
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("Erreur logoutMerchant:", error);
    res.status(500).json({ message: "Erreur lors de la déconnexion", error: error.message });
  }
};

const getMerchantProducts = async (req, res) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId non trouvé dans req.user" });
    }

    const shop = await Shop.findOne({ merchantId }).populate("products");
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    const products = shop.products || [];
    for (const product of products) {
      if (product.stock === 10) {
        const merchant = await Merchant.findOne({ merchantId });
        if (merchant) {
          const userId = req.user.userId;
          const user = await User.findById(userId);
          if (user) {
            const notificationMessage = `Alerte Stock : Le produit "${product.name}" dans votre boutique a atteint un stock de 10 articles. Pensez à réapprovisionner !`;
            const existingNotification = await Notification.findOne({
              userId: user._id,
              message: notificationMessage,
            });
            if (!existingNotification) {
              const notification = new Notification({
                userId: user._id,
                message: notificationMessage,
                read: false,
              });
              await notification.save();
              console.log(`Notification enregistrée pour ${merchantId} avec userId ${user._id}:`, notification);
            }
          } else {
            console.log(`Utilisateur non trouvé pour userId: ${userId}`);
          }
        }
      }
    }

    res.status(200).json({ products: shop.products });
  } catch (error) {
    console.error("Erreur getMerchantProducts:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { merchantId, userIds, message } = req.body;

    if (!merchantId || !userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
      return res.status(400).json({ message: "merchantId, userIds (tableau) et message sont requis" });
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: "Marchand non trouvé" });
    }

    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }

    const notifications = [];
    for (const user of users) {
      const email = user.email;
      const notificationMessage = `${message} - De ${merchant.name || merchantId}`;

      const mailInfo = await transporter.sendMail({
        from: `"LoyaltyHub" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Nouveau message de votre marchand",
        text: notificationMessage,
        html: `<p>${notificationMessage}</p>`,
      });

      notifications.push({
        userId: user._id,
        email,
        message: notificationMessage,
        sentAt: new Date(),
        messageId: mailInfo.messageId,
      });

      console.log(`Email envoyé à ${email}:`, { userId: user._id, message: notificationMessage });
    }

    res.status(200).json({
      message: "Notifications envoyées avec succès par email",
      notifications,
    });
  } catch (error) {
    console.error("Erreur sendNotification:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: "Utilisateur non authentifié ou userId manquant" });
    }

    const userId = req.user.userId;
    const merchantId = req.user.merchantId;

    console.log(`Récupération des notifications pour userId: ${userId}, merchantId: ${merchantId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId invalide" });
    }

    const userIdObject = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.find({ userId: userIdObject }).sort({ createdAt: -1 });

    if (!notifications.length) {
      console.log("Aucune notification trouvée pour cet utilisateur");
      return res.status(200).json({ message: "Aucune notification trouvée", notifications: [] });
    }

    console.log(`Notifications trouvées: ${notifications.length}`);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Erreur getNotifications:", error.stack);
    res.status(500).json({ message: "Erreur lors de la récupération des notifications", error: error.message });
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, price, description, imageUrl, stock, category } = req.body;
    const merchantId = req.user?.merchantId;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId non trouvé dans req.user" });
    }

    if (!name || !price || !category) {
      return res.status(400).json({ message: "name, price et category sont requis" });
    }

    const shop = await Shop.findOne({ merchantId });
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    let product = await Product.findOne({ name, shopId: shop._id });

    if (product) {
      const newStock = stock !== undefined ? Number(stock) : product.stock;
      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({ message: "stock doit être un nombre positif" });
      }

      product.stock = newStock;
      await product.save();

      console.log(`Stock mis à jour pour le produit existant: ${product.name}, nouveau stock: ${product.stock}`);

      if (product.stock === 10) {
        const merchant = await Merchant.findOne({ merchantId });
        if (merchant) {
          const userId = req.user.userId;
          const user = await User.findById(userId);
          if (user) {
            const notificationMessage = `Alerte Stock : Le produit "${product.name}" dans votre boutique a atteint un stock de 10 articles. Pensez à réapprovisionner !`;
            const existingNotification = await Notification.findOne({
              userId: user._id,
              message: notificationMessage,
            });
            if (!existingNotification) {
              const notification = new Notification({
                userId: user._id,
                message: notificationMessage,
                read: false,
              });
              await notification.save();
              console.log(`Notification enregistrée pour ${merchantId} avec userId ${user._id}:`, notification);
            }
          } else {
            console.log(`Utilisateur non trouvé pour userId: ${userId}`);
          }
        }
      }

      return res.status(200).json({ message: "Stock du produit mis à jour", product });
    }

    product = new Product({
      name,
      price: Number(price),
      description,
      imageUrl,
      stock: stock !== undefined ? Number(stock) : 0,
      category,
      shopId: shop._id,
    });
    await product.save();

    await Shop.findByIdAndUpdate(shop._id, { $push: { products: product._id } }, { new: true });

    console.log(`Nouveau produit ajouté: ${product.name}, stock: ${product.stock}`);

    if (product.stock === 10) {
      const merchant = await Merchant.findOne({ merchantId });
      if (merchant) {
        const user = await User.findOne({ merchantId });
        if (user) {
          const notificationMessage = `Alerte Stock : Le produit "${product.name}" dans votre boutique a atteint un stock de 10 articles. Pensez à réapprovisionner !`;
          const existingNotification = await Notification.findOne({
            userId: user._id,
            message: notificationMessage,
          });
          if (!existingNotification) {
            const notification = new Notification({
              userId: user._id,
              message: notificationMessage,
              read: false,
            });
            await notification.save();
            console.log(`Notification enregistrée pour ${merchantId}:`, notification);
          }
        }
      }
    }

    res.status(201).json({ message: "Produit ajouté", product });
  } catch (error) {
    console.error("Erreur addProduct:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const createLiquidationBasketIfNeeded = async (product, merchantId, shopId) => {
  try {
    const existingReward = await Reward.findOne({
      merchantId,
      type: "promotion",
      productId: product._id,
      endDate: { $gt: new Date() },
    });

    if (existingReward) {
      console.log(`Box de liquidation déjà existante pour le produit ${product._id}`);
      return;
    }

    if (product.stock <= 10 && product.stock > 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const discount = 30;

      const newReward = new Reward({
        merchantId,
        type: "promotion",
        productId: product._id,
        discountValue: discount,
        endDate,
      });

      const reward = await newReward.save();
      console.log(`Box de liquidation créée automatiquement pour ${product.name}:`, reward);
    }
  } catch (error) {
    console.error("Erreur lors de la création automatique de la box:", error);
  }
};

const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const productId = req.params.id;
    const merchantId = req.user?.merchantId;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId non trouvé dans req.user" });
    }

    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({ message: "stock doit être un nombre positif" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId invalide" });
    }

    const shop = await Shop.findOne({ merchantId });
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, shopId: shop._id },
      { stock: Number(stock) },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé ou n’appartient pas à cette boutique" });
    }

    await createLiquidationBasketIfNeeded(product, merchantId, shop._id);

    const isOutOfStock = product.stock === 0;
    console.log("Stock mis à jour avec succès:", { product, isOutOfStock });

    if (Number(stock) === 10) {
      const merchant = await Merchant.findOne({ merchantId });
      if (merchant) {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (user) {
          const notificationMessage = `Alerte Stock : Le produit "${product.name}" dans votre boutique a atteint un stock de 10 articles. Pensez à réapprovisionner !`;
          const existingNotification = await Notification.findOne({
            userId: user._id,
            message: notificationMessage,
          });
          if (!existingNotification) {
            const notification = new Notification({
              userId: user._id,
              message: notificationMessage,
              read: false,
            });
            await notification.save();
            console.log(`Notification enregistrée pour ${merchantId} avec userId ${user._id}:`, notification);
          }
        } else {
          console.log(`Utilisateur non trouvé pour userId: ${userId}`);
        }
      }
    }

    res.status(200).json({
      message: "Stock mis à jour",
      product,
      isOutOfStock,
    });
  } catch (error) {
    console.error("Erreur updateProductStock:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const createSeasonalLiquidationBasket = async (req, res) => {
  try {
    const { merchantId, items, endDate } = req.body;

    if (!merchantId || !items || !Array.isArray(items) || !endDate) {
      return res.status(400).json({ message: "merchantId, items (tableau) et endDate sont requis" });
    }

    const end = new GreaterDate(endDate);
    if (isNaN(end.getTime()) || end <= new Date()) {
      return res.status(400).json({ message: "endDate doit être une date future valide" });
    }

    const shop = await Shop.findOne({ merchantId });
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    const validItems = [];
    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        !item.quantity ||
        !item.originalPrice ||
        !item.category
      ) {
        return res.status(400).json({ message: "Chaque item doit avoir productId, quantity, originalPrice et category" });
      }

      const product = await Product.findOne({ _id: item.productId, shopId: shop._id });
      if (!product) {
        return res.status(404).json({ message: `Produit avec ID ${item.productId} non trouvé dans votre boutique` });
      }

      if (product.stock > 10) {
        return res.status(400).json({ message: `Produit ${product.name} a un stock (${product.stock}) supérieur à 10, non éligible pour liquidation` });
      }

      const discount = 30;

      validItems.push({
        productId: item.productId,
        quantity: Math.min(item.quantity, product.stock),
        originalPrice: item.originalPrice,
        discount,
        category: item.category,
        discountedPrice: item.originalPrice * (1 - discount / 100),
      });
    }

    const reward = new Reward({
      merchantId,
      type: "promotion",
      items: validItems,
      endDate: end,
    });
    await reward.save();

    console.log("Box de liquidation créée avec succès:", reward);
    res.status(201).json({ message: "Box de liquidation créée avec succès", reward });
  } catch (error) {
    console.error("Erreur createSeasonalLiquidationBasket:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getSeasonalBaskets = async (req, res) => {
  try {
    const { userId, all } = req.query;
    
    if (!userId && !all) return res.status(400).json({ message: "userId ou all requis" });
    
    // SUPPRESSION COMPLÈTE DU FILTRE DE DATE
    const query = {
      claimed: false, // Garde seulement les non-réclamées
    };

    // Si all est true, on prend toutes les récompenses actives sans filtre userId
    if (all === 'true') {
      // Pas de filtre userId, inclut toutes les récompenses de tous les marchands
    } else if (userId) {
      // Filtrer par userId si all n'est pas spécifié
      query.userId = userId;
    }

    const rewards = await Reward.find(query)
      .populate("productIds", "name price imageUrl stock category description")
      .populate("items.productId", "name price imageUrl stock category description")
      .populate("specialOffer.buyProductId", "name price imageUrl stock category")
      .populate("specialOffer.getProductId", "name price imageUrl stock category")
      .lean();

    // TESTS DE DEBUG
    console.log("🔍 Nombre de récompenses trouvées:", rewards.length);
    console.log("🔍 Marchands trouvés:", rewards.map(r => r.merchantId));
    console.log("🔍 Types trouvés:", rewards.map(r => ({ merchantId: r.merchantId, type: r.type })));

    const formattedBaskets = rewards.map(reward => {
      let type = reward.type;
      
      // Gardez seulement la logique pour les cas vraiment spéciaux
      if (reward.isLiquidation === true) {
        type = "seasonal_liquidation";
      }

      let formattedSpecialOffer = null;
      if (type === "specialOffer" && reward.specialOffer) {
        formattedSpecialOffer = {
          ...reward.specialOffer,
          buyProduct: reward.specialOffer.buyProductId || null,
          getProduct: reward.specialOffer.getProductId || null
        };
      }

      return {
        _id: reward._id,
        merchantId: reward.merchantId,
        type: type,
        startDate: reward.startDate,
        endDate: reward.endDate,
        discountValue: reward.discountValue || 0,
        discountValues: reward.discountValues || [],
        productIds: reward.productIds || [],
        items: reward.items || [],
        specialOffer: formattedSpecialOffer,
        customOffer: (type === "customOffer") ? reward.customOffer : null,
        claimed: reward.claimed || false
      };
    });

    // TEST DE DEBUG - VÉRIFIER LES DONNÉES FORMATÉES
    console.log("🔍 Paniers formatés:", formattedBaskets.map(b => ({
      merchantId: b.merchantId,
      type: b.type,
      _id: b._id
    })));

    if (!formattedBaskets.length) {
      return res.status(200).json({ baskets: [], message: "Aucune récompense active" });
    }

    res.status(200).json({ baskets: formattedBaskets });
  } catch (error) {
    console.error("Error getting seasonal baskets:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


const updatePromotionDiscount = async (req, res) => {
  try {
    const { merchantId, discount } = req.body;

    if (!merchantId || discount === undefined) {
      return res.status(400).json({ message: "merchantId et discount sont requis" });
    }

    const validDiscount = Math.min(Math.max(Number(discount), 0), 100);

    const merchant = await Merchant.findOneAndUpdate(
      { merchantId },
      { defaultPromotionDiscount: validDiscount },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Pourcentage de réduction par défaut pour les box de liquidation mis à jour", merchant });
  } catch (error) {
    console.error("Erreur updatePromotionDiscount:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const claimSpecialOffer = async (req, res) => {
  try {
    const { offerId, userId } = req.body;

    if (!offerId || !userId) {
      return res.status(400).json({ message: "offerId et userId requis" });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "offerId ou userId invalide" });
    }

    const offer = await Reward.findById(offerId);
    if (!offer || offer.type !== "specialOffer") {
      return res.status(404).json({ message: "Offre spéciale non trouvée" });
    }

    if (offer.claimed) {
      return res.status(400).json({ message: "Offre déjà réclamée" });
    }

    if (offer.endDate < new Date()) {
      return res.status(400).json({ message: "Offre expirée" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.loyaltyPoints < (offer.specialOffer.minPoints || 0)) {
      return res.status(400).json({ message: "Points insuffisants pour réclamer l’offre" });
    }

    offer.claimed = true;
    await offer.save();

    const rewardClaim = new RewardClaim({
      merchantId: offer.merchantId,
      userId,
      rewardId: offerId,
      status: "validated",
    });
    await rewardClaim.save();

    res.status(200).json({ message: "Offre spéciale réclamée avec succès", rewardClaim });
  } catch (error) {
    console.error("Erreur claimSpecialOffer:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getShopByMerchantId = async (req, res) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const shop = await Shop.findOne({ merchantId }).populate("products");
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    res.status(200).json({ shop });
  } catch (error) {
    console.error("Erreur getShopByMerchantId:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getPointsConfig = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: "Marchand non trouvé" });
    }

    res.status(200).json({ pointsConfig: merchant.pointsConfig });
  } catch (error) {
    console.error("Erreur getPointsConfig:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getSeasonalForecast = async (req, res) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const shop = await Shop.findOne({ merchantId: merchantId });
    if (!shop) {
      console.log(`Magasin non trouvé pour merchantId: ${merchantId}`);
      return res.status(404).json({ message: "Magasin non trouvé" });
    }

    const productIds = shop.products.map((p) => p.toString());
    console.log("Produits trouvés dans le magasin:", productIds);

    if (!productIds.length) {
      console.log("Aucun produit trouvé pour ce magasin.");
      return res.status(200).json({ message: "Aucun produit trouvé pour ce magasin" });
    }

    const orders = await Order.aggregate([
      { $match: { merchantId: merchantId, "items.productId": { $in: productIds.map((id) => new ObjectId(id)) } } },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: productIds.map((id) => new ObjectId(id)) } } },
      {
        $group: {
          _id: "$items.productId",
          salesCount: { $sum: 1 },
        },
      },
    ]);
    console.log("Commandes agrégées:", orders);

    if (!orders.length) {
      console.log("Aucune commande trouvée pour les produits de ce magasin.");
      return res.status(200).json({ message: "Aucune commande trouvée pour les produits de ce magasin" });
    }

    const forecast = [];
    const errors = [];
    for (const order of orders) {
      const productId = order._id.toString();
      console.log(`Traitement du produit ${productId}`);

      try {
        const response = await axios.post("http://localhost:8000/forecast", null, {
          params: { merchantId, productId },
          timeout: 5000,
        });
        console.log(`Réponse de FastAPI pour ${productId}:`, response.data);

        if (!response.data || !response.data.predictedDemand) {
          console.warn(`Données invalides de FastAPI pour ${productId}:`, response.data);
          errors.push({ productId, error: "Données invalides de FastAPI" });
          continue;
        }

        const { predictedDemand, period, monthlyPredictions } = response.data;

        const product = await Product.findById(productId);
        if (!product) {
          console.log(`Produit non trouvé pour productId: ${productId}`);
          errors.push({ productId, error: "Produit non trouvé" });
          continue;
        }

        const currentStock = product.stock || 0;
        const suggestedIncrease = Math.max(0, predictedDemand - currentStock);
        const suggestedPercentage = currentStock > 0 ? Math.round((suggestedIncrease / currentStock) * 100) : 100;

        forecast.push({
          productId,
          productName: product.name || `Produit ID ${productId}`,
          predictedDemand,
          currentStock,
          suggestedIncrease,
          suggestedPercentage: `${suggestedPercentage}%`,
          period,
          monthlyPredictions,
        });
      } catch (error) {
        console.error(`Erreur pour productId ${productId}:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        errors.push({
          productId,
          status: error.response?.status,
          detail: error.response?.data?.detail || error.message,
        });
        continue;
      }
    }

    if (forecast.length === 0) {
      console.log("Aucune prévision générée après traitement.");
      return res.status(200).json({
        message: "Aucune prévision générée",
        errors: errors.length > 0 ? errors : "Aucune donnée suffisante pour les produits de ce magasin",
      });
    }

    console.log("Prévisions générées:", forecast);
    res.status(200).json(forecast);
  } catch (error) {
    console.error("Erreur getSeasonalForecast:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getMerchantStats = async (req, res) => {
  try {
    const { startDate, endDate, compareStartMonth, compareEndMonth } = req.query;
    const merchantId = req.user?.merchantId || req.query.merchantId;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    // Définir les dates pour la période actuelle
    const currentMatchConditions = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: "Dates invalides ou startDate doit être avant endDate" });
      }
      currentMatchConditions.createdAt = { $gte: start, $lt: end };
    } else {
      // Par défaut, période actuelle (mois en cours)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      currentMatchConditions.createdAt = { $gte: startOfMonth, $lt: endOfMonth };
    }
    currentMatchConditions.merchantId = merchantId;

    // Définir les dates pour la période précédente (mois précédent ou période personnalisée)
    let previousMatchConditions = {};
    if (compareStartMonth && compareEndMonth) {
      const start = new Date(compareStartMonth);
      const end = new Date(compareEndMonth);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: "Dates de comparaison invalides" });
      }
      previousMatchConditions.createdAt = { $gte: start, $lt: end };
    } else {
      // Par défaut, mois précédent
      const now = new Date();
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      previousMatchConditions.createdAt = { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth };
    }
    previousMatchConditions.merchantId = merchantId;

    // Statistiques actuelles
    const currentStats = await Order.aggregate([
      { $match: currentMatchConditions },
      {
        $group: {
          _id: "$merchantId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalProductsSold: { $sum: { $sum: "$items.quantity" } },
          uniqueCustomers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          merchantId: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          totalProductsSold: 1,
          activeCustomers: { $size: "$uniqueCustomers" },
        },
      },
    ]);

    // Statistiques précédentes pour comparaison
    const previousStats = await Order.aggregate([
      { $match: previousMatchConditions },
      {
        $group: {
          _id: "$merchantId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalProductsSold: { $sum: { $sum: "$items.quantity" } },
          uniqueCustomers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          merchantId: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          totalProductsSold: 1,
          activeCustomers: { $size: "$uniqueCustomers" },
        },
      },
    ]);

    // Agrégation pour les ventes mensuelles (pour la courbe)
    const monthlyStats = await Order.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: {
            merchantId: "$merchantId",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalProductsSold: { $sum: { $sum: "$items.quantity" } },
        },
      },
      {
        $project: {
          merchantId: "$_id.merchantId",
          month: { $arrayElemAt: [["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"], "$_id.month"] },
          year: "$_id.year",
          totalRevenue: 1,
          totalOrders: 1,
          totalProductsSold: 1,
        },
      },
      { $sort: { "year": 1, "_id.month": 1 } },
    ]);

    // Calculer les changements
    const currentStat = currentStats[0] || { totalOrders: 0, totalRevenue: 0, totalProductsSold: 0, activeCustomers: 0 };
    const previousStat = previousStats[0] || { totalOrders: 0, totalRevenue: 0, totalProductsSold: 0, activeCustomers: 0 };

    const calculateChange = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const formattedStats = [{
      merchantId,
      revenue: currentStat.totalRevenue || 0,
      revenueChange: calculateChange(currentStat.totalRevenue, previousStat.totalRevenue),
      orders: currentStat.totalOrders || 0,
      ordersChange: calculateChange(currentStat.totalOrders, previousStat.totalOrders),
      activeCustomers: currentStat.activeCustomers || 0,
      customersChange: calculateChange(currentStat.activeCustomers, previousStat.activeCustomers),
      productsSold: currentStat.totalProductsSold || 0,
      productsChange: calculateChange(currentStat.totalProductsSold, previousStat.totalProductsSold),
      monthlyStats: monthlyStats
        .filter(m => m.merchantId && m.merchantId.toString() === merchantId.toString())
        .map(m => ({
          month: `${m.month} ${m.year}`,
          revenue: m.totalRevenue || 0,
          orders: m.totalOrders || 0,
          productsSold: m.totalProductsSold || 0,
        })),
    }];

    console.log("Statistiques par boutique avec ventes mensuelles:", formattedStats);
    res.status(200).json(formattedStats);
  } catch (error) {
    console.error("Erreur getMerchantStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
const fetchAnalyticsData = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token d’authentification manquant");

    const response = await fetch(`http://192.168.43.57:5000/api/interactions/analytics-by-shop?targetId=${user.merchantId || '67cbcda686f7c90571dae512'}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    setAnalytics(data || {});
  } catch (error) {
    setMessage(`❌ Erreur : ${error.message}`);
  }
};
const getMerchantActiveRewards = async (req, res) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "MerchantId is required",
      });
    }

    const currentDate = new Date();
    const activeRewards = await Reward.find({
      merchantId,
      claimed: false,
      startDate: { $lte: currentDate },
      endDate: { $gt: currentDate },
    })
      .populate("productId", "name price")
      .populate("specialOffer.buyProductId", "name price")
      .populate("specialOffer.getProductId", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rewards: activeRewards,
      count: activeRewards.length,
    });
  } catch (error) {
    console.error("Error fetching merchant active rewards:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const setupMerchantPayment = async (req, res) => {
  console.log("🔵 Requête reçue sur /api/setup-payment :", req.body);
  
  try {
    const { merchantId, cardToken } = req.body;

    // Validation
    if (!merchantId || !cardToken) {
      console.error("❌ Données manquantes : merchantId ou cardToken");
      return res.status(400).json({ 
        success: false, 
        message: "merchantId et cardToken sont requis" 
      });
    }

    // Vérifie que le marchand existe
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      console.error(`❌ Marchand ${merchantId} introuvable`);
      return res.status(404).json({ 
        success: false, 
        message: "Marchand non trouvé" 
      });
    }

    // Crée la méthode de paiement Stripe
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: cardToken }
    });
    console.log("✅ Méthode de paiement Stripe créée :", paymentMethod.id);

    // Met à jour le marchand
    merchant.stripePaymentMethodId = paymentMethod.id;
    merchant.paymentMethodSetupDate = new Date();
    await merchant.save();

    console.log(`✅ Marchand ${merchantId} mis à jour avec la méthode de paiement`);
    res.status(200).json({
      success: true,
      paymentMethodId: paymentMethod.id,
      message: "Méthode de paiement configurée"
    });

  } catch (error) {
    console.error("❌ Erreur Stripe :", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la configuration du paiement",
      error: error.message
    });
  }
};



module.exports = {
  getLoyalCustomers,
  addPoints,
  getOrderHistory,
  getPointsConfig,
  createReward,
  getRewards,
  getRewardClaims,
  updateRewardClaimStatus,
  getMerchantProfile,
  updateMerchantProfile,
  updatePointsConfig,
  getAllShops,
  logoutMerchant,
  getMerchantProducts,
  sendNotification,
  addProduct,
  updateProductStock,
  createSeasonalLiquidationBasket,
  getSeasonalBaskets,
  updatePromotionDiscount,
  claimSpecialOffer,
  getShopByMerchantId,
  getNotifications,
  getSeasonalForecast,
  getMerchantStats, // Ajouté ici
  fetchAnalyticsData,
  getMerchantActiveRewards,
 setupMerchantPayment
};