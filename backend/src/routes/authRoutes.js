const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

// Routes publiques (ne nécessitent pas de token JWT)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/notify-referrer", authController.notifyReferrer);
router.get("/check-user", authController.checkUserExists);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/profile/:userId", authController.getUserById);

// Routes protégées (nécessitent un token JWT)
router.get("/loyalty", authenticateToken, authController.getLoyaltyPoints);
router.get("/badges", authController.getBadges); // Publique
router.post("/update-badges", authController.updateBadges); // Publique
router.post("/update-badges", authenticateToken, authController.updateBadges); 
router.get("/scan", authenticateToken, authController.handleQrCodeScan);
router.get("/referral-code", authenticateToken, authController.getReferralCode);
router.post("/send-referral-email", authenticateToken, authController.sendReferralEmail);
router.get("/get-notifications", authenticateToken, authController.getNotifications);
router.post("/mark-notification-as-read", authenticateToken, authController.markNotificationAsRead);
router.post("/delete-notification", authenticateToken, authController.deleteNotification);
router.put("/profile/:userId", authController.updateProfile);
router.post("/addPurchase", authenticateToken, authController.addPurchase);
router.post("/addLoyaltyPointsFromPuzzle", authenticateToken, authController.addLoyaltyPointsFromPuzzle);
router.post("/addLoyaltyPointsFromTreasureDig", authenticateToken, authController.addLoyaltyPointsFromTreasureDig);
router.post("/addLoyaltyPointsFromTreasureHunterMemory", authenticateToken, authController.addLoyaltyPointsFromTreasureHunterMemory);
router.get("/merchant/customers", authenticateToken, authController.getMerchantCustomers);
router.post("/loyalty/addPointsFromBadge", authController.addLoyaltyPointsFromBadge);

module.exports = router;