const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const User = require("../models/User");
const Reward = require("../models/Reward");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const StockHistory = require("../models/StockHistory");
const { v4: uuidv4 } = require("uuid");
const Merchant = require("../models/Merchant");

// Fonction pour calculer le niveau de fidélité par marchand
const calculateMerchantLoyaltyLevel = (purchaseCount) => {
  if (purchaseCount > 5) return "Or";
  if (purchaseCount >= 3) return "Argent";
  return "Bronze";
};

// Fonction pour mettre à jour le niveau de fidélité global
const updateLoyaltyLevel = async (user) => {
  const now = new Date();
  const totalPoints = user.loyaltyPoints || 0;
  const purchaseCount = user.loyaltyProgress?.purchaseCount || 0;
  const scanDates = user.scanDates || [];

  const uniquePurchaseMonths = new Set(
    scanDates
      .map(date => {
        const d = new Date(date);
        return isNaN(d) ? null : `${d.getFullYear()}-${d.getMonth() + 1}`;
      })
      .filter(month => month !== null)
  ).size;

  const successfulReferrals = user.referrals?.length || 0;

  console.log(`Debug updateLoyaltyLevel - user: ${user.nom}, points: ${totalPoints}, purchaseCount: ${purchaseCount}, uniquePurchaseMonths: ${uniquePurchaseMonths}, successfulReferrals: ${successfulReferrals}, currentLevel: ${user.loyaltyLevel}`);

  let newLevel = "Découvreur";
  if (purchaseCount >= 1 || totalPoints >= 100) {
    newLevel = "Initié";
  }
  if (totalPoints >= 500 && purchaseCount >= 3 && uniquePurchaseMonths >= 3) {
    newLevel = "Fidèle";
  }
  if (totalPoints >= 2000 && purchaseCount >= 8 && uniquePurchaseMonths >= 6 && successfulReferrals >= 1) {
    newLevel = "VIP";
  }
  if (totalPoints >= 5000 && purchaseCount >= 15 && uniquePurchaseMonths >= 12 && successfulReferrals >= 3) {
    newLevel = "Ambassadeur";
  }

  if (newLevel !== user.loyaltyLevel) {
    user.loyaltyLevel = newLevel;
    user.loyaltyProgress = {
      ...user.loyaltyProgress,
      totalPoints,
      purchaseCount,
      uniquePurchaseMonths,
      successfulReferrals,
      lastLevelUpdate: new Date(),
    };
    console.log(`Niveau mis à jour pour ${user.nom} : ${newLevel}`);
  } else {
    user.loyaltyProgress = {
      ...user.loyaltyProgress,
      totalPoints,
      purchaseCount,
      uniquePurchaseMonths,
      successfulReferrals,
      lastLevelUpdate: user.loyaltyProgress?.lastLevelUpdate || new Date(),
    };
  }
};

const createPaymentIntent = async (req, res) => {
  console.log("Route /api/order/create-payment-intent atteinte avec:", req.body);
  try {
    const { amount, productId, isPremiumView } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Un montant valide est requis." });
    }

    // Si c'est pour la vue 3D premium, valider le montant et productId
    if (isPremiumView) {
      if (amount !== 500) { // 5€ en centimes
        return res.status(400).json({ message: "Le montant pour la vue 3D premium doit être de 5€." });
      }
      if (!productId) {
        return res.status(400).json({ message: "productId est requis pour la vue 3D premium." });
      }
      // Vérifier que le produit existe
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Produit avec ID ${productId} non trouvé.` });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Montant en centimes
      currency: "eur",
      description: isPremiumView ? "Accès à la vue 3D premium" : "Commande LoyaltyHub",
      metadata: { productId: productId || "", isPremiumView: !!isPremiumView },
    });

    console.log("PaymentIntent créé:", paymentIntent.id);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur création PaymentIntent:", error.message);
    res.status(500).json({ message: "Erreur lors de la création du paiement", error: error.message });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : uuidv4();
    console.log("userId utilisé:", userId);

    const { items, totalAmount, paymentIntentId, shippingAddress } = req.body;

    // Validation des entrées
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Les articles sont requis et doivent être valides." });
    }
    if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
      return res.status(400).json({ message: "Un montant total valide est requis." });
    }
    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId est requis." });
    }
    if (
      !shippingAddress ||
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return res.status(400).json({ message: "Tous les champs de l'adresse de livraison sont requis." });
    }

    const validCountries = [
      "France",
      "Canada",
      "Maroc",
      "Allemagne",
      "Espagne",
      "Italie",
      "Belgique",
      "Suisse",
      "Tunisie",
      "Algérie",
    ];
    if (!validCountries.includes(shippingAddress.country)) {
      return res.status(400).json({ message: "Pays non valide. Veuillez choisir un pays de la liste." });
    }

    const firstItem = items[0];
    if (!firstItem.productId) {
      return res.status(400).json({ message: "Chaque article doit avoir un productId." });
    }

    const product = await Product.findById(firstItem.productId);
    if (!product) {
      return res.status(404).json({ message: `Produit avec ID ${firstItem.productId} non trouvé.` });
    }

    const shop = await Shop.findById(product.shopId);
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable pour ce produit." });
    }

    if (!shop.merchantId) {
      return res.status(400).json({ message: "La boutique n'a pas de merchantId défini." });
    }
    const merchantId = shop.merchantId;
    console.log("merchantId déduit:", merchantId);

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: "Marchand non trouvé." });
    }

    const multipliers = merchant.pointsConfig?.multipliers || new Map();
    console.log("Multiplicateurs récupérés:", multipliers);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Le paiement n'a pas été validé." });
    }
    if (paymentIntent.amount !== totalAmount * 100) {
      return res.status(400).json({ message: "Le montant payé ne correspond pas au total de la commande." });
    }

    // Calcul des points de base avec multiplicateurs par catégorie
    const baseLoyaltyPointsEarned = items.reduce((totalPoints, item) => {
      if (!item.productId || !item.quantity || !item.price || !item.category) {
        throw new Error("Un ou plusieurs articles sont incomplets (productId, quantity, price, category requis).");
      }
      
      const normalizedCategory = item.category
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      let categoryMultiplier = 1.0;
      for (const [key, value] of multipliers.entries()) {
        const normalizedKey = key
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (normalizedKey === normalizedCategory) {
          categoryMultiplier = value;
          break;
        }
      }
      
      console.log(`Catégorie: ${item.category}, Multiplicateur catégorie: ${categoryMultiplier}`);
      
      const itemPoints = item.price * item.quantity * categoryMultiplier * 10;
      return totalPoints + itemPoints;
    }, 0);

    let user = await User.findById(userId);
    let currentLoyaltyPoints = user ? user.loyaltyPoints || 0 : 0;

    const currentDate = new Date();
    const activeSpecialOffer = await Reward.findOne({
      merchantId,
      type: "specialOffer",
      "specialOffer.type": "multiplicationPoints",
      startDate: { $lte: currentDate },
      endDate: { $gt: currentDate },
      claimed: false,
    });

    let finalLoyaltyPointsEarned = baseLoyaltyPointsEarned;
    let offerMultiplier = 1;

    if (activeSpecialOffer && activeSpecialOffer.specialOffer?.multiplier) {
      offerMultiplier = activeSpecialOffer.specialOffer.multiplier;
      finalLoyaltyPointsEarned = Math.round(baseLoyaltyPointsEarned * offerMultiplier);
      console.log(`🎉 Offre spéciale active !`);
      console.log(`Points de base de la commande: ${baseLoyaltyPointsEarned}`);
      console.log(`Multiplicateur offre spéciale: x${offerMultiplier}`);
      console.log(`Points finaux de la commande: ${finalLoyaltyPointsEarned}`);
    }

    const finalTotalPoints = currentLoyaltyPoints + finalLoyaltyPointsEarned;

    console.log(`📊 Récapitulatif des points:`);
    console.log(`- Points existants: ${currentLoyaltyPoints}`);
    console.log(`- Points gagnés cette commande: ${finalLoyaltyPointsEarned}`);
    console.log(`- Total final: ${finalTotalPoints}`);

    const countryCoordinates = {
      "France": { lat: 46.6034, lng: 1.8883 },
      "Algérie": { lat: 28.0339, lng: 1.6596 },
      "Tunisie": { lat: 33.8869, lng: 9.5375 },
      "Canada": { lat: 56.1304, lng: -106.3468 },
      "Maroc": { lat: 31.7917, lng: -7.0926 },
      "Allemagne": { lat: 51.1657, lng: 10.4515 },
      "Espagne": { lat: 40.4637, lng: -3.7492 },
      "Italie": { lat: 41.8719, lng: 12.5674 },
      "Belgique": { lat: 50.5039, lng: 4.4699 },
      "Suisse": { lat: 46.8182, lng: 8.2275 },
    };
    const coordinates = countryCoordinates[shippingAddress.country] || { lat: 0, lng: 0 };

    const order = new Order({
      userId,
      merchantId,
      items,
      totalAmount,
      loyaltyPoints: finalLoyaltyPointsEarned,
      paymentIntentId,
      shippingAddress,
      coordinates,
    });
    await order.save();
    console.log("Commande créée avec ID:", order._id);

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Produit avec ID ${item.productId} non trouvé.` });
      }
      if (product.stock === 0) {
        return res.status(400).json({
          message: `Le produit ${product.name} est en rupture de stock.`,
          productId: item.productId,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`,
          productId: item.productId,
        });
      }
      product.stock -= item.quantity;
      await product.save();
      console.log(`Stock mis à jour pour ${product.name}: Nouveau stock = ${product.stock}`);

      const stockHistory = new StockHistory({
        productId: product._id,
        shopId: product.shopId,
        changeType: "sale",
        quantity: -item.quantity,
        stockAfter: product.stock,
        reason: `Commande #${order._id}`,
      });
      await stockHistory.save();
    }

    if (user) {
      user.loyaltyPoints = finalTotalPoints;

      if (!user.loyaltyProgress) {
        user.loyaltyProgress = {
          purchaseCount: 0,
          totalPoints: 0,
          uniquePurchaseMonths: 0,
          successfulReferrals: 0,
          merchantLoyalty: []
        };
      }

      user.loyaltyProgress.purchaseCount = (user.loyaltyProgress.purchaseCount || 0) + 1;
      user.loyaltyProgress.totalPoints = finalTotalPoints;

      if (!user.scanDates) user.scanDates = [];
      user.scanDates.push(new Date());

      const uniquePurchaseMonths = new Set(
        user.scanDates
          .map(date => {
            const d = new Date(date);
            return isNaN(d) ? null : `${d.getFullYear()}-${d.getMonth() + 1}`;
          })
          .filter(month => month !== null)
      ).size;
      user.loyaltyProgress.uniquePurchaseMonths = uniquePurchaseMonths;

      let merchantLoyalty = user.loyaltyProgress.merchantLoyalty.find(ml => ml.merchantId === merchantId);
      if (merchantLoyalty) {
        merchantLoyalty.purchaseCount += 1;
        merchantLoyalty.lastOrderDate = new Date();
        merchantLoyalty.loyaltyLevel = calculateMerchantLoyaltyLevel(merchantLoyalty.purchaseCount);
        console.log(`🔄 Mise à jour fidélité marchand ${merchantId}: ${merchantLoyalty.purchaseCount} achats, niveau ${merchantLoyalty.loyaltyLevel}`);
      } else {
        user.loyaltyProgress.merchantLoyalty.push({
          merchantId,
          purchaseCount: 1,
          loyaltyLevel: "Bronze",
          lastOrderDate: new Date(),
        });
        console.log(`🆕 Nouvelle fidélité marchand ${merchantId}: 1 achat, niveau Bronze`);
      }

      await updateLoyaltyLevel(user);
      
      await user.save();
      console.log(`✅ Utilisateur mis à jour - Points: ${user.loyaltyPoints}, Achats: ${user.loyaltyProgress.purchaseCount}, Niveau: ${user.loyaltyLevel}`);
    } else {
      user = new User({ 
        _id: userId, 
        loyaltyPoints: finalTotalPoints,
        loyaltyProgress: {
          purchaseCount: 1,
          totalPoints: finalTotalPoints,
          uniquePurchaseMonths: 1,
          successfulReferrals: 0,
          merchantLoyalty: [{
            merchantId,
            purchaseCount: 1,
            loyaltyLevel: "Bronze",
            lastOrderDate: new Date(),
          }]
        },
        scanDates: [new Date()],
        loyaltyLevel: finalTotalPoints >= 100 ? "Initié" : "Découvreur"
      });
      await user.save();
      console.log(`🆕 Nouvel utilisateur créé avec points ${userId}: ${user.loyaltyPoints}`);
    }

    let reward = await Reward.findOne({ userId });
    if (!reward) {
      reward = new Reward({
        userId,
        merchantId,
        type: "specialOffer",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        specialOffer: { type: "multiplicationPoints" },
        points: 0,
        history: [],
      });
    }
    reward.points = finalTotalPoints;
    reward.history.push({ 
      orderId: order._id, 
      pointsEarned: finalLoyaltyPointsEarned,
      basePointsEarned: baseLoyaltyPointsEarned,
      offerMultiplier 
    });
    await reward.save();

    console.log("✅ Commande confirmée et points enregistrés:", { order, reward });
    res.status(200).json({ 
      message: "Commande confirmée.", 
      order, 
      finalPoints: finalTotalPoints,
      pointsEarnedThisOrder: finalLoyaltyPointsEarned,
      offerMultiplierApplied: offerMultiplier > 1 ? offerMultiplier : null
    });
  } catch (error) {
    console.error("❌ Erreur lors de la confirmation de commande :", error.message);
    res.status(500).json({ message: "Erreur interne.", error: error.message });
  }
};

const getLastOrder = async (req, res) => {
  try {
    const lastOrder = await Order.findOne().sort({ createdAt: -1 }).limit(1);
    if (!lastOrder) {
      return res.status(404).json({ message: "Aucune commande trouvée" });
    }

    console.log("Dernière commande trouvée:", lastOrder);

    res.status(200).json({
      userId: lastOrder.userId,
      orderId: lastOrder._id.toString(),
    });
  } catch (error) {
    console.error("Erreur dans getLastOrder:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("Reçu orderId:", orderId);
    if (!orderId) {
      return res.status(400).json({ message: "orderId est requis." });
    }
    const order = await Order.findById(orderId);
    console.log("Résultat de findById:", order);
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }
    console.log("Commande trouvée:", order);
    res.status(200).json({
      orderId: order._id.toString(),
      userId: order.userId,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error("Erreur dans getOrderById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    console.log("Liste des commandes récupérées :", orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur dans getAllOrders :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getOrdersByCountry = async (req, res) => {
  try {
    const { merchantId } = req.query;
    console.log("📡 Requête reçue pour getOrdersByCountry avec merchantId:", merchantId);

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const countryCoordinates = {
      Tunisie: { lat: 36.8065, lng: 10.1815 },
      France: { lat: 48.8566, lng: 2.3522 },
      Canada: { lat: 45.4215, lng: -75.6972 },
      Maroc: { lat: 31.7917, lng: -7.0926 },
      Allemagne: { lat: 52.5200, lng: 13.4050 },
      Espagne: { lat: 40.4168, lng: -3.7038 },
      Italie: { lat: 41.9028, lng: 12.4964 },
      Belgique: { lat: 50.8503, lng: 4.3517 },
      Suisse: { lat: 46.9480, lng: 7.4474 },
      Algérie: { lat: 36.7372, lng: 3.0870 },
    };

    const orders = await Order.find({ merchantId }).lean();
    console.log("📊 Nombre de commandes trouvées:", orders.length);

    if (!orders.length) {
      console.log("📊 Aucune commande trouvée pour merchantId:", merchantId);
      return res.status(200).json([]);
    }

    const countryCounts = {};
    orders.forEach((order) => {
      const country = order.shippingAddress?.country || "Inconnu";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0);
    const countries = Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
        coordinates: countryCoordinates[country] || { lat: 0, lng: 0 },
      }))
      .filter(country => country.coordinates.lat !== 0 && country.coordinates.lng !== 0);

    console.log("📊 Données démographiques par pays:", JSON.stringify(countries, null, 2));
    res.status(200).json(countries);
  } catch (error) {
    console.error("❌ Erreur dans getOrdersByCountry:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getRecentOrders = async (req, res) => {
  try {
    const { merchantId, limit = 5 } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const orders = await Order.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate({
        path: "items.productId",
        select: "name price category imageUrl",
      });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur getRecentOrders:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getOrderFrequencyByClientShop = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis", data: [] });
    }

    const orders = await Order.find({ merchantId }).lean();

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    const frequencyData = {};
    for (const order of orders) {
      const product = order.items[0]?.productId ? await Product.findById(order.items[0].productId) : null;
      const shopId = product ? (await Shop.findById(product.shopId))._id.toString() : "unknown_shop";
      const userId = order.userId.toString();
      const key = `${userId}_${shopId}`;
      if (!frequencyData[key]) {
        frequencyData[key] = { userId, shopId, count: 0, totalAmount: 0 };
      }
      frequencyData[key].count += 1;
      frequencyData[key].totalAmount += order.totalAmount || 0;
    }

    const result = Object.values(frequencyData).map(data => ({
      userId: data.userId,
      shopId: data.shopId,
      orderFrequency: data.count,
      averageOrderAmount: data.count > 0 ? (data.totalAmount / data.count).toFixed(2) : "0.00",
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur getOrderFrequencyByClientShop:", error);
    res.status(500).json({ message: "Erreur serveur", data: [] });
  }
};

// Nouvelle fonction spécifique pour le paiement premium par le marchand
const createMerchantPremiumPayment = async (req, res) => {
  console.log("Route /api/order/merchant-premium-payment atteinte avec:", req.body);
  try {
    const { productId, merchantId } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ message: "productId est requis pour la vue 3D premium." });
    }
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId est requis." });
    }

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `Produit avec ID ${productId} non trouvé.` });
    }

    // Récupérer les informations du marchand
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: "Marchand non trouvé." });
    }

    // Vérifier que le marchand a une méthode de paiement configurée
    if (!merchant.stripePaymentMethodId) {
      return res.status(400).json({ 
        message: "Aucune méthode de paiement configurée pour ce marchand. Veuillez configurer votre carte de paiement." 
      });
    }

    // Montant fixe pour la vue 3D premium (5€)
    const amount = 500; // 5€ en centimes

    // Créer et confirmer le paiement directement côté serveur
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      description: `Accès vue 3D premium - Produit: ${product.name}`,
      payment_method: merchant.stripePaymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: { 
        productId: productId,
        merchantId: merchantId,
        isPremiumView: "true",
        type: "merchant_premium_payment"
      },
    });

    console.log("Paiement premium marchand créé et confirmé:", paymentIntent.id);
    
    // Si le paiement a réussi, marquer le produit comme ayant accès premium
    if (paymentIntent.status === 'succeeded') {
      await Product.findByIdAndUpdate(productId, {
        $set: { 
          premiumAccess: true,
          premiumPaymentDate: new Date(),
          premiumPaymentIntentId: paymentIntent.id
        }
      });
      
      console.log(`✅ Accès premium activé pour le produit ${productId}`);
      return res.status(200).json({ 
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: "Paiement premium réussi. Accès à la vue 3D activé.",
        productId: productId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Le paiement n'a pas pu être confirmé.",
        status: paymentIntent.status
      });
    }
    
  } catch (error) {
    console.error("Erreur paiement premium marchand:", error.message);
    
    // Gestion des erreurs spécifiques Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        success: false,
        message: "Erreur de carte: " + error.message,
        decline_code: error.decline_code 
      });
    }
    
    if (error.code === 'payment_method_not_available') {
      return res.status(400).json({
        success: false,
        message: "Méthode de paiement non disponible. Veuillez vérifier votre carte."
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Erreur lors du paiement premium", 
      error: error.message 
    });
  }
};

// Fonction pour vérifier si un produit a accès premium
const checkPremiumAccess = async (req, res) => {
  try {
    const { productId, merchantId } = req.query;
    
    if (!productId || !merchantId) {
      return res.status(400).json({ message: "productId et merchantId sont requis." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé." });
    }

    // Vérifier si le produit a accès premium
    const hasAccess = product.premiumAccess || false;
    
    res.status(200).json({
      productId,
      hasAccess,
      paymentDate: product.premiumPaymentDate || null,
      message: hasAccess ? "Accès premium actif" : "Accès premium non activé"
    });
    
  } catch (error) {
    console.error("Erreur vérification accès premium:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Fonction pour configurer la méthode de paiement du marchand (à appeler une seule fois)
const setupMerchantPaymentMethod = async (req, res) => {
  try {
    const { merchantId, cardToken } = req.body;

    if (!merchantId || !cardToken) {
      return res.status(400).json({ message: "merchantId et cardToken sont requis." });
    }

    // Créer une méthode de paiement à partir du token
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: cardToken
      }
    });

    // Mettre à jour le marchand avec la méthode de paiement
    const updatedMerchant = await Merchant.findOneAndUpdate(
      { merchantId },
      { 
        stripePaymentMethodId: paymentMethod.id,
        paymentMethodSetupDate: new Date()
      },
      { new: true }
    );

    if (!updatedMerchant) {
      return res.status(404).json({ message: "Marchand non trouvé." });
    }

    res.status(200).json({
      message: "Méthode de paiement configurée avec succès.",
      paymentMethodId: paymentMethod.id,
      merchantId: merchantId
    });

  } catch (error) {
    console.error("Erreur setup méthode de paiement:", error.message);
    res.status(500).json({ message: "Erreur configuration paiement", error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmOrder,
  getLastOrder,
  getOrderById,
  getAllOrders,
  getOrdersByCountry,
  getRecentOrders,
  getOrderFrequencyByClientShop,
   createMerchantPremiumPayment,
  checkPremiumAccess,
  setupMerchantPaymentMethod
};