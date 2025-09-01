const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Stripe = require("stripe");
const Merchant = require("../models/Merchant");
const Product = require("../models/Product");
const Shop = require("../models/Shop");

const {
  getLoyalCustomers,
  addPoints,
  getOrderHistory,
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
  getPointsConfig,
  getSeasonalForecast,
  getMerchantStats,
  getMerchantActiveRewards,
} = require("../controllers/merchantController");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Routes existantes
router.get("/loyal-customers", authMiddleware, getLoyalCustomers);
router.post("/add-points", authMiddleware, addPoints);
router.get("/order-history", authMiddleware, getOrderHistory);
router.post("/create-reward", authMiddleware, createReward);
router.get("/rewards", authMiddleware, getRewards);
router.get("/reward-claims", authMiddleware, getRewardClaims);
router.put("/reward-claim/:claimId/status", authMiddleware, updateRewardClaimStatus);
router.get("/profile", authMiddleware, getMerchantProfile);
router.put("/profile", authMiddleware, updateMerchantProfile);
router.post("/update-points-config", authMiddleware, updatePointsConfig);
router.get("/shops", authMiddleware, getAllShops);
router.post("/logout", authMiddleware, logoutMerchant);
router.get("/products", authMiddleware, getMerchantProducts);
router.post("/send-notification", authMiddleware, sendNotification);
router.post("/products", authMiddleware, addProduct);
router.patch("/products/:id/stock", authMiddleware, updateProductStock);
router.post("/seasonal-liquidation", authMiddleware, createSeasonalLiquidationBasket);
router.get("/seasonal-baskets", authMiddleware, getSeasonalBaskets);
router.put("/promotion-discount", authMiddleware, updatePromotionDiscount);
router.post("/claim-special-offer", authMiddleware, claimSpecialOffer);
router.get("/shops/:merchantId", authMiddleware, getShopByMerchantId);
router.get("/notifications", authMiddleware, getNotifications);
router.get("/points-config", authMiddleware, getPointsConfig);
router.get("/seasonal-forecast", authMiddleware, getSeasonalForecast);
router.get("/stats", authMiddleware, getMerchantStats);
router.get("/rewards/:merchantId", authMiddleware, getMerchantActiveRewards);

// Configuration du paiement
router.post('/setup-payment', authMiddleware, async (req, res) => {
  try {
    const { merchantId, paymentMethodId } = req.body;

    // 1. Trouver le marchand
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ 
        success: false, 
        message: "Marchand non trouvé" 
      });
    }

    // 2. Créer un customer Stripe si inexistant
    let customer;
    if (merchant.stripeCustomerId) {
      customer = await stripe.customers.retrieve(merchant.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: merchant.email || `${merchantId}@no-email.com`,
        name: merchant.businessName || `Marchand ${merchantId}`,
        metadata: { merchantId }
      });
    }

    // 3. Attacher la méthode de paiement
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });

    // 4. Définir comme méthode par défaut
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // 5. Sauvegarder en base
    merchant.stripeCustomerId = customer.id;
    merchant.stripePaymentMethodId = paymentMethodId;
    merchant.paymentMethodConfigured = true;
    merchant.paymentMethodSetupDate = new Date();
    await merchant.save();

    res.json({ 
      success: true, 
      message: "Paiement configuré avec succès",
      customerId: customer.id
    });

  } catch (error) {
    console.error("❌ Erreur configuration paiement:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: error.code || "STRIPE_ERROR"
    });
  }
});

// Paiement premium avec gestion améliorée
router.post("/premium-payment", authMiddleware, async (req, res) => {
  try {
    const { productId, merchantId, paymentMethodId } = req.body;

    // Validation des données
    if (!productId || !merchantId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "Données de paiement incomplètes"
      });
    }

    // Vérification du produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    // Vérifier si le produit a déjà un accès premium
    if (product.premiumAccess) {
      return res.status(400).json({
        success: false,
        message: "Ce produit a déjà un accès premium"
      });
    }

    // Vérification du marchand
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Marchand non trouvé"
      });
    }

    // Création du paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // 5€ en centimes
      currency: 'eur',
      payment_method: paymentMethodId,
      confirm: true,
      description: `Premium pour ${product.name}`,
      metadata: { 
        productId, 
        merchantId,
        productName: product.name
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    // Vérification du statut du paiement
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({
        success: false,
        message: "Le paiement n'a pas pu être traité",
        paymentStatus: paymentIntent.status
      });
    }

    // Mise à jour du produit avec transaction
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          premiumAccess: true,
          premiumPaymentDate: new Date(),
          premiumPaymentIntentId: paymentIntent.id,
          premiumActivatedBy: merchantId
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedProduct) {
      // Si la mise à jour échoue, on devrait idéalement rembourser
      console.error("❌ Échec de la mise à jour du produit après paiement réussi");
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'activation du premium"
      });
    }

    // Log pour le suivi
    console.log(`✅ Premium activé pour le produit ${productId} par ${merchantId}`);

    // Réponse de succès
    res.json({
      success: true,
      message: "Premium activé avec succès",
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        premiumAccess: updatedProduct.premiumAccess,
        premiumPaymentDate: updatedProduct.premiumPaymentDate
      },
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error("❌ Erreur paiement premium:", error);
    
    // Gestion spécifique des erreurs Stripe
    let errorMessage = "Erreur lors du paiement";
    let statusCode = 500;
    
    if (error.type === 'StripeCardError') {
      errorMessage = error.message;
      statusCode = 402;
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = "Informations de paiement invalides";
      statusCode = 400;
    } else if (error.code === 'authentication_required') {
      errorMessage = "Authentification requise pour cette carte";
      statusCode = 402;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      code: error.code || 'PAYMENT_ERROR',
      type: error.type || 'UNKNOWN_ERROR'
    });
  }
});
// Fonctions utilitaires
async function createStripeCustomer(merchant) {
  const customer = await stripe.customers.create({
    email: merchant.email || `${merchant.merchantId}@no-email.com`,
    name: merchant.businessName || `Marchand ${merchant.merchantId}`,
    metadata: { merchantId: merchant.merchantId }
  });
  return customer.id;
}

async function createNewPaymentMethod(merchant) {
  // Dans une implémentation réelle, vous devriez collecter
  // les nouvelles informations de carte depuis le frontend
  // Ceci est un exemple simplifié
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number: '4242424242424242', // Exemple de carte de test
      exp_month: 12,
      exp_year: new Date().getFullYear() + 1,
      cvc: '123'
    }
  });
  return paymentMethod.id;
}

async function attachPaymentMethod(paymentMethodId, customerId) {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
  } catch (error) {
    console.error("Erreur attachement méthode paiement:", error);
    throw error;
  }
}

// Routes de debug et vérification
router.post("/test-update-product", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Produit non trouvé" });
    }
    
    const updateResult = await Product.updateOne(
      { _id: productId },
      { 
        $set: {
          premiumAccess: true,
          premiumPaymentDate: new Date(),
          premiumPaymentIntentId: "test_debug_" + Date.now()
        }
      }
    );
    
    const updatedProduct = await Product.findById(productId);
    
    res.json({ 
      success: true, 
      message: "Test de mise à jour terminé",
      updateResult,
      productBefore: existingProduct,
      productAfter: updatedProduct
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route de debug pour mise à jour forcée
router.post("/debug-update-product", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId requis"
      });
    }

    const productBefore = await Product.findById(productId);
    if (!productBefore) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    // Force la mise à jour
    const productAfter = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          premiumAccess: true,
          premiumPaymentDate: new Date(),
          premiumPaymentIntentId: `debug_${Date.now()}`
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Produit mis à jour en mode debug",
      productBefore: {
        id: productBefore._id,
        premiumAccess: productBefore.premiumAccess || false
      },
      productAfter: {
        id: productAfter._id,
        premiumAccess: productAfter.premiumAccess,
        premiumPaymentDate: productAfter.premiumPaymentDate
      }
    });

  } catch (error) {
    console.error("❌ Erreur debug update:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour debug"
    });
  }
});

// Autres routes utilitaires
router.get("/check-premium-access", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.query;
    const product = await Product.findById(productId);
    
    res.json({ 
      success: true, 
      hasAccess: product?.premiumAccess || false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/toggle-premium", authMiddleware, async (req, res) => {
  try {
    const { productId, merchantId } = req.body;
    const product = await Product.findById(productId);
    const shop = await Shop.findOne({ _id: product.shopId, merchantId });
    
    if (!shop) {
      return res.status(403).json({ 
        success: false, 
        message: "Non autorisé" 
      });
    }

    product.premiumAccess = !product.premiumAccess;
    await product.save();
    
    res.json({
      success: true,
      premiumAccess: product.premiumAccess
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/check-payment-method", authMiddleware, async (req, res) => {
  try {
    const { merchantId } = req.query;
    const merchant = await Merchant.findOne({ merchantId });
    
    res.json({ 
      success: true, 
      hasPaymentMethod: !!merchant?.stripePaymentMethodId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/premium-products", authMiddleware, async (req, res) => {
  try {
    const { merchantId } = req.query;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "merchantId requis"
      });
    }

    // Récupérer les boutiques du marchand
    const shops = await Shop.find({ merchantId }).select('_id');
    const shopIds = shops.map(shop => shop._id);

    if (shopIds.length === 0) {
      return res.json({
        success: true,
        premiumProducts: []
      });
    }

    // Récupérer les produits premium
    const premiumProducts = await Product.find({ 
      shopId: { $in: shopIds },
      premiumAccess: true 
    }).select('_id name premiumPaymentDate');

    res.json({
      success: true,
      premiumProducts: premiumProducts.map(p => p._id),
      count: premiumProducts.length
    });

  } catch (error) {
    console.error("❌ Erreur récupération produits premium:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
});

module.exports = router;