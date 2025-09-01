const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Reward = require("../models/Reward");

const axios = require("axios");
const fs = require("fs");
const { parse } = require("json2csv");

// Fonction pour calculer les features d’un client
const calculateCustomerFeatures = async (userId, merchantId) => {
  const currentDate = new Date();

  const orders = await Order.find({ userId, merchantId }).sort({ createdAt: -1 });
  const user = await User.findById(userId);
  const reward = await Reward.findOne({ userId, merchantId });

  const lastOrder = orders.length > 0 ? orders[0] : null;
  const daysSinceLastOrder = lastOrder
    ? Math.floor((currentDate - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24))
    : Infinity;

  const sixMonthsAgo = new Date(currentDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentOrders = orders.filter((order) => new Date(order.createdAt) >= sixMonthsAgo);
  const orderFrequency = recentOrders.length / 6;

  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const lastThreeMonthsOrders = recentOrders.filter(
    (order) => new Date(order.createdAt) >= threeMonthsAgo
  );
  const previousThreeMonthsOrders = recentOrders.filter(
    (order) => new Date(order.createdAt) < threeMonthsAgo
  );
  const frequencyLastThreeMonths = lastThreeMonthsOrders.length / 3;
  const frequencyPreviousThreeMonths = previousThreeMonthsOrders.length / 3 || 1;
  const frequencyVariation =
    ((frequencyLastThreeMonths - frequencyPreviousThreeMonths) / frequencyPreviousThreeMonths) * 100;

  const lastThreeOrders = orders.slice(0, 3);
  const averageOrderAmount =
    lastThreeOrders.length > 0
      ? lastThreeOrders.reduce((sum, order) => sum + order.totalAmount, 0) / lastThreeOrders.length
      : 0;

  const previousThreeOrders = orders.slice(3, 6);
  const previousAverageOrderAmount =
    previousThreeOrders.length > 0
      ? previousThreeOrders.reduce((sum, order) => sum + order.totalAmount, 0) / previousThreeOrders.length
      : averageOrderAmount || 1;
  const amountVariation =
    ((averageOrderAmount - previousAverageOrderAmount) / previousAverageOrderAmount) * 100;

  const rewardHistory = reward?.history || [];
  // Supprime : const specialRewardHistory = specialReward?.history || [];
  // Utilise uniquement rewardHistory
  const lastPointsActivity = rewardHistory.length ? rewardHistory[0] : null;
  const daysSinceLastPointsActivity = lastPointsActivity
    ? Math.floor((currentDate - new Date(lastPointsActivity.date)) / (1000 * 60 * 60 * 24))
    : Infinity;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentNotifications = (user?.notifications || []).filter(
    (notif) => new Date(notif.date) >= thirtyDaysAgo
  );
  const readNotifications = recentNotifications.filter((notif) => notif.read).length;
  const notificationReadRate =
    recentNotifications.length > 0 ? (readNotifications / recentNotifications.length) * 100 : 0;

  return {
    userId: userId.toString(),
    daysSinceLastOrder,
    orderFrequency,
    frequencyVariation,
    averageOrderAmount,
    amountVariation,
    daysSinceLastPointsActivity,
    notificationReadRate,
    loyaltyPoints: user?.loyaltyPoints || 0,
  };
};

// Fonction pour exporter les features dans un CSV
const exportCustomerFeatures = async (req, res) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const orders = await Order.find({ merchantId });
    const userIds = [...new Set(orders.map((order) => order.userId.toString()))];
    const validUserIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const customerFeatures = await Promise.all(
      validUserIds.map((userId) => calculateCustomerFeatures(userId, merchantId))
    );

    const fields = [
      "userId",
      "daysSinceLastOrder",
      "orderFrequency",
      "frequencyVariation",
      "averageOrderAmount",
      "amountVariation",
      "daysSinceLastPointsActivity",
      "notificationReadRate",
      "loyaltyPoints",
    ];
    const csv = parse(customerFeatures, { fields });

    fs.writeFileSync("customer_features.csv", csv);
    res.status(200).json({ message: "Features exportées dans customer_features.csv" });
  } catch (error) {
    console.error("Erreur exportCustomerFeatures:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Analyse du désengagement
const analyzeDisengagement = async (req, res) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const orders = await Order.find({ merchantId });
    const userIds = [...new Set(orders.map((order) => order.userId.toString()))];
    const validUserIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const customerFeatures = await Promise.all(
      validUserIds.map((userId) => calculateCustomerFeatures(userId, merchantId))
    );

    const response = await axios.post("http://localhost:5004/predict_disengagement", {
      customers: customerFeatures,
    });

    const classifiedCustomers = response.data.map((customer) => {
      const { daysSinceLastOrder, disengagementScore, status } = customer;

      // Priorité absolue au statut prédit par predict_disengagement.py
      let finalStatus = status;

      // Ajustements uniquement si le statut prédit est incohérent avec des seuils critiques
      if (disengagementScore > 75 && finalStatus !== "Disengaged") {
        finalStatus = "Disengaged";
      } else if (daysSinceLastOrder > 4 && finalStatus !== "Disengaged") {
        finalStatus = "Disengaged";
      } else if (disengagementScore > 50 && disengagementScore <= 75 && finalStatus !== "AtRisk" && finalStatus !== "Disengaged") {
        finalStatus = "AtRisk";
      }

      const reasons = [
        daysSinceLastOrder > 4 ? `Inactif depuis ${daysSinceLastOrder} jours` : null,
        daysSinceLastOrder >= 2 && daysSinceLastOrder <= 3 ? `Inactif entre 2 et 3 jours` : null,
        customer.frequencyVariation < -20 ? `Fréquence d'achat en baisse de ${Math.abs(customer.frequencyVariation).toFixed(1)}%` : null,
        customer.notificationReadRate < 50 ? `Faible lecture des notifications (${customer.notificationReadRate.toFixed(1)}%)` : null,
        customer.amountVariation < -20 ? `Montant moyen en baisse de ${Math.abs(customer.amountVariation).toFixed(1)}%` : null,
      ].filter(Boolean);

      return { ...customer, status: finalStatus, reasons };
    });

    classifiedCustomers.sort((a, b) => b.disengagementScore - a.disengagementScore);
    res.status(200).json({ customers: classifiedCustomers });
  } catch (error) {
    console.error("Erreur analyzeDisengagement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Déclencher des actions
const triggerDisengagementActions = async (req, res) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId requis" });
    }

    const orders = await Order.find({ merchantId });
    const userIds = [...new Set(orders.map((order) => order.userId.toString()))];
    const validUserIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const customerFeatures = await Promise.all(
      validUserIds.map((userId) => calculateCustomerFeatures(userId, merchantId))
    );

    const response = await axios.post("http://localhost:5004/predict_disengagement", {
      customers: customerFeatures,
    });

    const classifiedCustomers = response.data;
    const actions = [];

    for (const customer of classifiedCustomers) {
      if (customer.status === "AtRisk") {
        const message = "Revenez avec 10% de réduction sur votre prochaine commande !";
        console.log(`Simulation : Notification envoyée à ${customer.userId}: ${message}`);
        actions.push({ userId: customer.userId, action: "Notification simulée (offre 10%)" });
      } else if (customer.status === "Disengaged") {
        const user = await User.findById(customer.userId);
        if (user) {
          user.loyaltyPoints = (user.loyaltyPoints || 0) + 500;
          await user.save();
          const message = "Revenez et profitez de vos 500 points bonus !";
          console.log(`Simulation : Notification envoyée à ${customer.userId}: ${message}`);
          actions.push({ userId: customer.userId, action: "500 points bonus ajoutés + notification simulée" });
        }
      }
    }

    res.status(200).json({ message: "Actions déclenchées", actions });
  } catch (error) {
    console.error("Erreur triggerDisengagementActions:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les métriques du modèle
const getModelMetrics = async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5004/model_metrics");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Erreur getModelMetrics:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { analyzeDisengagement, triggerDisengagementActions, getModelMetrics, exportCustomerFeatures };