const express = require("express");
const router = express.Router();
const Interaction = require("../models/Interaction");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

async function analyzeSentiment(comment) {
  try {
    const response = await fetch("http://192.168.43.57:5001/api/analyze-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const result = await response.json();
    return result.sentiment || "neutre";
  } catch (error) {
    console.error("Erreur appel API sentiment :", error.message);
    if (comment && typeof comment === "string") {
      if (comment.toLowerCase().includes("super") || comment.toLowerCase().includes("excellent")) return "positif";
      if (comment.toLowerCase().includes("mauvais") || comment.toLowerCase().includes("horrible")) return "négatif";
    }
    return "neutre";
  }
}

// Ajouter une interaction
router.post("/", async (req, res) => {
  const { userId, type, targetId, targetType, value, comment } = req.body;
  console.log("Requête POST /api/interactions reçue :", { userId, type, targetId, targetType, value, comment });

  if (!userId || userId === "undefined") {
    console.error("Erreur : userId est manquant ou non valide");
    return res.status(400).json({ message: "userId est requis et doit être valide" });
  }

  try {
    const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    let sentiment = "neutre";
    if (type === "review" && comment) {
      sentiment = await analyzeSentiment(comment);
    }

    const interaction = new Interaction({
      userId: userIdObj,
      type,
      targetId,
      targetType,
      value,
      comment,
      sentiment,
    });
    await interaction.save();
    console.log("Interaction enregistrée avec succès :", interaction);
    res.status(201).json({ message: "Interaction enregistrée", interaction });
  } catch (error) {
    console.error("Erreur détaillée lors de l’enregistrement de l’interaction :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// Récupérer les interactions
router.get("/user", async (req, res) => {
  const { userId } = req.query;
  console.log("Requête GET /api/interactions/user reçue :", { userId });
  try {
    const interactions = await Interaction.find({ userId }).populate("targetId", "name category");
    res.json(interactions);
  } catch (error) {
    console.error("Erreur récupération interactions :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/", async (req, res) => {
  try {
    console.log("✅ Requête GET /api/interactions reçue !");
    const interactions = await Interaction.find();
    res.json(interactions);
  } catch (error) {
    console.error("❌ Erreur récupération interactions :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/analytics-by-shop", async (req, res) => {
  const { targetId } = req.query;
  console.log("Requête GET /api/interactions/analytics-by-shop reçue :", { targetId });

  if (!targetId) {
    return res.status(400).json({ message: "targetId est requis" });
  }

  try {
    let targetIdObj;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetIdObj = new mongoose.Types.ObjectId(targetId);
    } else {
      const shop = await Shop.findOne({ merchantId: targetId });
      if (!shop) {
        console.log(`Aucun shop trouvé pour merchantId: ${targetId}`);
        return res.status(404).json({ message: `Aucun shop trouvé pour merchantId: ${targetId}` });
      }
      targetIdObj = shop._id;
    }

    const shopExistsInInteractions = await Interaction.findOne({ targetId: targetIdObj, targetType: "Shop" });
    if (!shopExistsInInteractions) {
      console.log(`Aucune interaction trouvée pour le shop avec targetId: ${targetIdObj}`);
      return res.status(404).json({ message: `Aucune interaction trouvée pour le shop avec targetId: ${targetIdObj}` });
    }

    // Compter tous les visiteurs uniques (sans filtrer les non-commandants)
    const visitedUserIds = (await Interaction.distinct("userId", {
      targetId: targetIdObj,
      targetType: "Shop",
      type: "visit",
    }))
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id)) || [];

    const uniqueVisitors = visitedUserIds.length;

    const totalPageviews = await Interaction.countDocuments({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "visit",
    }).catch(err => {
      console.error("Erreur countDocuments :", err);
      return 0;
    });

    const visits = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "visit",
    }).sort({ createdAt: 1 }).lean() || [];

    let totalDuration = 0;
    let validSessions = 0;

    for (let i = 0; i < visits.length - 1; i++) {
      const currentVisit = visits[i];
      const nextVisit = visits[i + 1];
      const timeDiff = nextVisit ? (nextVisit.createdAt - currentVisit.createdAt) / 1000 : 0;

      if (timeDiff > 1 && timeDiff <= 1800) {
        totalDuration += timeDiff;
        validSessions++;
      }
    }

    const visitDuration = validSessions > 0 ? Math.round(totalDuration / validSessions) : 0;

    const singlePageVisits = await Interaction.aggregate([
      { $match: { targetId: targetIdObj, targetType: "Shop", type: "visit" } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $match: { count: 1 } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]).catch(err => {
      console.error("Erreur agrégation Bounce Rate :", err);
      return [{ total: 0 }];
    });
    const bounceRate = totalPageviews > 0
      ? Math.min(100, Math.round((singlePageVisits[0]?.total || 0) / (totalPageviews / visitedUserIds.length) * 100))
      : 0;

    const analyticsData = {
      targetId,
      uniqueVisitors,
      totalPageviews,
      visitDuration,
      bounceRate: `${bounceRate}%`,
    };

    console.log("Données analytics renvoyées :", analyticsData);
    res.status(200).json(analyticsData);
  } catch (error) {
    console.error("Erreur lors du calcul des métriques analytiques :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

router.get("/analytics-by-shop/daily", async (req, res) => {
  const { targetId, days = 30 } = req.query;
  console.log("Requête GET /api/interactions/analytics-by-shop/daily reçue :", { targetId, days });

  if (!targetId) {
    return res.status(400).json({ message: "targetId est requis" });
  }

  try {
    let targetIdObj;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetIdObj = new mongoose.Types.ObjectId(targetId);
    } else {
      const shop = await Shop.findOne({ merchantId: targetId });
      if (!shop) {
        return res.status(404).json({ message: `Aucun shop trouvé pour merchantId: ${targetId}` });
      }
      targetIdObj = shop._id;
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);

    const dailyStats = await Interaction.aggregate([
      {
        $match: {
          targetId: targetIdObj,
          targetType: "Shop",
          type: "visit",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          uniqueVisitors: { $addToSet: "$userId" },
          totalPageviews: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          uniqueVisitors: { $size: "$uniqueVisitors" },
          totalPageviews: "$totalPageviews",
          _id: 0,
        },
      },
      { $sort: { date: 1 } } // Correction : $sort dans le pipeline
    ]).catch(err => {
      console.error("Erreur agrégation quotidienne :", err);
      return [];
    });

    const filledStats = Array.from({ length: days }, (_, i) => {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split("T")[0];
      return dailyStats.find((s) => s.date === dateStr) || {
        date: dateStr,
        uniqueVisitors: 0,
        totalPageviews: 0,
      };
    });

    console.log("Données quotidiennes renvoyées :", { dailyVisitors: filledStats });
    res.status(200).json({ dailyVisitors: filledStats });
  } catch (error) {
    console.error("Erreur lors du calcul des stats quotidiennes :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

router.get("/analytics-by-shop/top-pages", async (req, res) => {
  const { targetId, limit = 5 } = req.query;
  console.log("Requête GET /api/interactions/analytics-by-shop/top-pages reçue :", { targetId, limit });

  if (!targetId) {
    return res.status(400).json({ message: "targetId est requis" });
  }

  try {
    let targetIdObj;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetIdObj = new mongoose.Types.ObjectId(targetId);
    } else {
      const shop = await Shop.findOne({ merchantId: targetId });
      if (!shop) {
        return res.status(404).json({ message: `Aucun shop trouvé pour merchantId: ${targetId}` });
      }
      targetIdObj = shop._id;
    }

    const topPages = await Interaction.aggregate([
      {
        $match: {
          targetId: targetIdObj,
          targetType: "Shop",
          type: "visit",
          pageUrl: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$pageUrl",
          pageviews: { $sum: 1 },
        },
      },
      {
        $sort: { pageviews: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          pageviews: 1,
        },
      },
    ]).catch(err => {
      console.error("Erreur agrégation top pages :", err);
      return [];
    });

    if (topPages.length === 0) {
      console.log("Aucune donnée de top pages trouvée pour targetId :", targetIdObj);
      return res.status(200).json({ topPages: [], message: "Aucune donnée de top pages disponible." });
    }

    console.log("Données top pages renvoyées :", { topPages });
    res.status(200).json({ topPages });
  } catch (error) {
    console.error("Erreur lors du calcul des top pages :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});


router.get("/analytics-by-shop/reviews-metrics", async (req, res) => {
  const { targetId, useMerchantId = "false", period = "monthly" } = req.query;
  console.log("Requête GET /api/interactions/analytics-by-shop/reviews-metrics reçue :", { targetId, useMerchantId, period });

  if (!targetId) {
    return res.status(400).json({ message: "targetId est requis" });
  }

  try {
    let targetIdObj;

    if (useMerchantId === "true" && !mongoose.Types.ObjectId.isValid(targetId)) {
      targetIdObj = targetId; // targetId est un merchantId (String)
    } else if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetIdObj = new mongoose.Types.ObjectId(targetId); // targetId est un ObjectId
    } else {
      const shop = await Shop.findOne({ merchantId: targetId });
      if (!shop) {
        return res.status(404).json({ message: `Aucun shop trouvé pour merchantId: ${targetId}` });
      }
      targetIdObj = shop._id; // Convertit merchantId en ObjectId du shop
    }

    // Déterminer le merchantId à utiliser pour les filtres Order
    let merchantIdToUse = useMerchantId === "true" ? targetId : (await Shop.findOne({ _id: targetIdObj }))?.merchantId || targetId;

    // Définir la période
    const endDate = new Date();
    let startDate;
    switch (period.toLowerCase()) {
      case "quarterly":
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "annually":
        startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "monthly":
      default:
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    // *** NOUVEAU : Récupérer les produits de la boutique ***
    const Product = require("../models/Product"); // Assurez-vous d'importer le modèle Product
    const shopProducts = await Product.find({ shopId: targetIdObj }).lean();
    const productIds = shopProducts.map(product => product._id);
    
    console.log(`Produits trouvés pour la boutique ${targetIdObj}:`, productIds.length);

    // Récupérer toutes les interactions pour identifier les "new subscribers"
    const allInteractions = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
    }).lean() || [];

    const currentPeriodInteractions = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean() || [];

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(startDate.getMonth() - 1); // Pour monthly
    const previousPeriodInteractions = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
    }).lean() || [];

    // Calcul des new subscribers (visite + review ou commande pour la première fois)
    const newSubscriberChecks = await Promise.all(currentPeriodInteractions.map(async interaction => {
      const userInteractions = allInteractions.filter(i => i.userId.toString() === interaction.userId.toString() && i.targetId.toString() === targetIdObj.toString());
      const firstInteraction = userInteractions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      const hasVisit = currentPeriodInteractions.some(i => i.userId.toString() === interaction.userId.toString() && i.type === "visit");
      const hasReview = currentPeriodInteractions.some(i => i.userId.toString() === interaction.userId.toString() && i.type === "review");
      let hasOrder = null;
      if (mongoose.Types.ObjectId.isValid(interaction.userId)) {
        hasOrder = await Order.findOne({
          userId: new mongoose.Types.ObjectId(interaction.userId),
          merchantId: merchantIdToUse,
          createdAt: { $gte: startDate, $lte: endDate }
        });
      } else {
        hasOrder = await Order.findOne({
          userId: interaction.userId,
          merchantId: merchantIdToUse,
          createdAt: { $gte: startDate, $lte: endDate }
        });
      }
      return firstInteraction && new Date(firstInteraction.createdAt) >= startDate && hasVisit && (hasReview || hasOrder);
    }));
    const newSubscribers = [...new Set(currentPeriodInteractions
      .filter((_, index) => newSubscriberChecks[index])
      .map(interaction => interaction.userId.toString())
    )].length;

    // Calcul des previousPeriodNewSubscribers
    const previousSubscriberChecks = await Promise.all(previousPeriodInteractions.map(async interaction => {
      const userInteractions = allInteractions.filter(i => i.userId.toString() === interaction.userId.toString() && i.targetId.toString() === targetIdObj.toString());
      const firstInteraction = userInteractions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      const hasVisit = previousPeriodInteractions.some(i => i.userId.toString() === interaction.userId.toString() && i.type === "visit");
      const hasReview = previousPeriodInteractions.some(i => i.userId.toString() === interaction.userId.toString() && i.type === "review");
      let hasOrder = null;
      if (mongoose.Types.ObjectId.isValid(interaction.userId)) {
        hasOrder = await Order.findOne({
          userId: new mongoose.Types.ObjectId(interaction.userId),
          merchantId: merchantIdToUse,
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        });
      } else {
        hasOrder = await Order.findOne({
          userId: interaction.userId,
          merchantId: merchantIdToUse,
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        });
      }
      return firstInteraction && new Date(firstInteraction.createdAt) >= previousPeriodStart && new Date(firstInteraction.createdAt) < startDate && hasVisit && (hasReview || hasOrder);
    }));
    const previousPeriodNewSubscribers = [...new Set(previousPeriodInteractions
      .filter((_, index) => previousSubscriberChecks[index])
      .map(interaction => interaction.userId.toString())
    )].length;

    // Variation par rapport au mois précédent
    const newSubscribersChange = previousPeriodNewSubscribers > 0
      ? ((newSubscribers - previousPeriodNewSubscribers) / previousPeriodNewSubscribers) * 100
      : newSubscribers > 0 ? 100 : 0;

    // Récupérer les avis pour la période sélectionnée (boutique seulement pour les métriques)
    const reviews = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "review",
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean() || [];

    // *** MODIFICATION PRINCIPALE : Récupérer TOUS les commentaires (boutique + produits) ***
    const shopReviews = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "review",
      comment: { $exists: true, $ne: null, $ne: "" }
    })
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

    // *** NOUVEAU : Récupérer les commentaires des produits de la boutique ***
    const productReviews = await Interaction.find({
      targetId: { $in: productIds },
      targetType: "Product",
      type: "review",
      comment: { $exists: true, $ne: null, $ne: "" }
    })
    .populate("userId", "nom email")
    .populate("targetId", "name") // Pour récupérer le nom du produit
    .sort({ createdAt: -1 })
    .lean();

    console.log(`Commentaires boutique trouvés: ${shopReviews.length}`);
    console.log(`Commentaires produits trouvés: ${productReviews.length}`);

    // *** Combiner tous les commentaires (boutique + produits) ***
    const allCustomerReviews = [
      ...shopReviews.map(review => ({
        ...review,
        productName: null, // Pas de nom de produit pour les avis boutique
        isProductReview: false
      })),
      ...productReviews.map(review => ({
        ...review,
        productName: review.targetId?.name || "Produit inconnu",
        isProductReview: true
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, 50); // Limiter à 50 commentaires les plus récents

    // Formater les commentaires pour le frontend
    const formattedCustomerReviews = allCustomerReviews.map(review => ({
      _id: review._id,
      comment: review.comment,
      sentiment: review.sentiment || "neutre",
      value: review.value || 0,
      targetType: review.targetType,
      productName: review.productName, // *** NOUVEAU CHAMP ***
      isProductReview: review.isProductReview, // *** NOUVEAU CHAMP ***
      user: review.userId ? {
        name: `${review.userId.nom}`.trim() || "Utilisateur anonyme",
        email: review.userId.email
      } : { name: "Utilisateur anonyme", email: null },
      createdAt: review.createdAt
    }));

    const previousPeriodReviews = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "review",
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
    }).lean() || [];

    if (!currentPeriodInteractions.length && !reviews.length) {
      console.log("Aucune donnée trouvée pour targetId :", targetIdObj);
      return res.status(200).json({
        averageRating: 0.00,
        positiveRate: 0.00,
        negativeRate: 0.00,
        totalReviews: 0,
        newSubscribers: 0,
        newSubscribersChange: "0.00%",
        conversionRate: 0.00,
        bounceRate: "0%",
        positiveRateLastPeriod: 0.00,
        negativeRateLastPeriod: 0.00,
        conversionRateLastWeek: 0.00,
        bounceRateLastWeek: "0%",
        customerReviews: formattedCustomerReviews // Même avec 0 donnée boutique, renvoyer les commentaires produits
      });
    }

    const sentimentScores = { positif: 5, neutre: 3, négatif: 1 };
    const totalReviews = reviews.length;
    const sentimentCounts = reviews.reduce(
      (acc, review) => {
        const sentiment = review.sentiment ? review.sentiment.toLowerCase() : "neutre";
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      { positif: 0, neutre: 0, négatif: 0 }
    );

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + (sentimentScores[review.sentiment ? review.sentiment.toLowerCase() : "neutre"] || 3), 0) / totalReviews
        : 0.00;

    const positiveRate = totalReviews > 0 ? (sentimentCounts.positif / totalReviews) * 100 : 0.00;
    const negativeRate = totalReviews > 0 ? (sentimentCounts.négatif / totalReviews) * 100 : 0.00;

    // Calcul des métriques supplémentaires
    const uniqueVisitors = [...new Set(currentPeriodInteractions.filter(i => i.type === "visit").map(v => v.userId.toString()))].length;
    const totalInteractions = reviews.length + (await Order.countDocuments({ merchantId: merchantIdToUse, createdAt: { $gte: startDate, $lte: endDate } }).catch(() => 0));
    const conversionRate = uniqueVisitors > 0 ? (totalInteractions / uniqueVisitors) * 100 : 0.00;

    const singlePageVisits = await Interaction.aggregate([
      { $match: { targetId: targetIdObj, targetType: "Shop", type: "visit", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $match: { count: 1 } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]).catch(err => {
      console.error("Erreur agrégation Bounce Rate :", err);
      return [{ total: 0 }];
    });
    const bounceRate = uniqueVisitors > 0
      ? Math.min(100, Math.round((singlePageVisits[0]?.total || 0) / uniqueVisitors * 100))
      : 0;

    // Calcul pour la semaine précédente
    const oneWeekAgo = new Date(endDate);
    oneWeekAgo.setDate(endDate.getDate() - 7);
    const previousWeekInteractions = await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      createdAt: { $gte: oneWeekAgo, $lt: startDate },
    }).lean() || [];
    const previousWeekUniqueVisitors = [...new Set(previousWeekInteractions.filter(i => i.type === "visit").map(v => v.userId.toString()))].length;
    const previousWeekInteractionsCount = (await Interaction.find({
      targetId: targetIdObj,
      targetType: "Shop",
      type: "review",
      createdAt: { $gte: oneWeekAgo, $lt: startDate },
    }).lean() || []).length + (await Order.countDocuments({ merchantId: merchantIdToUse, createdAt: { $gte: oneWeekAgo, $lt: startDate } }).catch(() => 0));
    const conversionRateLastWeek = previousWeekUniqueVisitors > 0 ? (previousWeekInteractionsCount / previousWeekUniqueVisitors) * 100 : 0.00;
    const previousWeekSinglePageVisits = await Interaction.aggregate([
      { $match: { targetId: targetIdObj, targetType: "Shop", type: "visit", createdAt: { $gte: oneWeekAgo, $lt: startDate } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $match: { count: 1 } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]).catch(err => {
      console.error("Erreur agrégation Bounce Rate :", err);
      return [{ total: 0 }];
    });
    const bounceRateLastWeek = previousWeekUniqueVisitors > 0
      ? Math.min(100, Math.round((previousWeekSinglePageVisits[0]?.total || 0) / previousWeekUniqueVisitors * 100))
      : 0;

    // Comparaisons pour la période précédente
    const positiveRateLastPeriod = previousPeriodReviews.length > 0
      ? (previousPeriodReviews.reduce((acc, review) => {
          const sentiment = review.sentiment ? review.sentiment.toLowerCase() : "neutre";
          return sentiment === "positif" ? acc + 1 : acc;
        }, 0) / previousPeriodReviews.length) * 100
      : 0.00;
    const negativeRateLastPeriod = previousPeriodReviews.length > 0
      ? (previousPeriodReviews.reduce((acc, review) => {
          const sentiment = review.sentiment ? review.sentiment.toLowerCase() : "neutre";
          return sentiment === "négatif" ? acc + 1 : acc;
        }, 0) / previousPeriodReviews.length) * 100
      : 0.00;

    console.log("Métriques renvoyées :", {
      averageRating,
      positiveRate,
      negativeRate,
      totalReviews,
      newSubscribers,
      newSubscribersChange,
      conversionRate,
      bounceRate,
      positiveRateLastPeriod,
      negativeRateLastPeriod,
      conversionRateLastWeek,
      bounceRateLastWeek,
      customerReviewsCount: formattedCustomerReviews.length,
      shopReviewsCount: shopReviews.length,
      productReviewsCount: productReviews.length
    });

    res.status(200).json({
      averageRating: Number(averageRating.toFixed(2)),
      positiveRate: Number(positiveRate.toFixed(2)),
      negativeRate: Number(negativeRate.toFixed(2)),
      totalReviews,
      newSubscribers,
      newSubscribersChange: `${newSubscribersChange.toFixed(2)}%`,
      conversionRate: Number(conversionRate.toFixed(2)),
      bounceRate: `${bounceRate}%`,
      positiveRateLastPeriod: Number(positiveRateLastPeriod.toFixed(2)),
      negativeRateLastPeriod: Number(negativeRateLastPeriod.toFixed(2)),
      conversionRateLastWeek: Number(conversionRateLastWeek.toFixed(2)),
      bounceRateLastWeek: `${bounceRateLastWeek}%`,
      // *** MODIFICATION PRINCIPALE : Inclure tous les commentaires (boutique + produits) ***
      customerReviews: formattedCustomerReviews
    });
  } catch (error) {
    console.error("Erreur lors du calcul des métriques :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
module.exports = router;