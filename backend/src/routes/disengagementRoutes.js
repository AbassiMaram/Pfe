const express = require("express");
const router = express.Router();
const disengagementController = require("../controllers/disengagementAnalysis");

// Route pour analyser le désengagement
router.get("/analyze", disengagementController.analyzeDisengagement);

// Route pour déclencher des actions
router.post("/trigger-actions", disengagementController.triggerDisengagementActions);

// Route pour récupérer les métriques du modèle
router.get("/model-metrics", disengagementController.getModelMetrics);

// Route pour exporter les features (corrigée)
router.get("/export-features", disengagementController.exportCustomerFeatures);

module.exports = router;