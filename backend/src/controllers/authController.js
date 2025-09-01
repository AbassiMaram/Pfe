const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const mongoose = require("mongoose");
const transporter = require("../utils/email");
const axios = require("axios");
const Shop = require("../models/Shop");

require("dotenv").config();

// Fonction pour vérifier le score reCAPTCHA v3
const verifyRecaptcha = async (token) => {
  try {
    console.log("Début de la vérification reCAPTCHA...");
    const startTime = Date.now();

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
        timeout: 15000,
      }
    );

    const endTime = Date.now();
    console.log(`Vérification reCAPTCHA terminée en ${(endTime - startTime) / 1000} secondes. Résultat :`, response.data);

    if (!response.data || typeof response.data.success !== "boolean") {
      throw new Error("Réponse reCAPTCHA invalide.");
    }
    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors de la vérification reCAPTCHA :", error.message);
    return { success: false, score: 0, error: error.message };
  }
};

// Fonction pour générer un code de parrainage unique
const generateReferralCode = async (nom) => {
  const cleanNom = nom.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let referralCode = "";
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    referralCode = `${cleanNom}${randomNum}`;

    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referralCode;
};

// Fonction pour générer un ID unique pour les notifications
const generateNotificationId = (notifications) => {
  if (!notifications || notifications.length === 0) return 1;
  const maxId = Math.max(...notifications.map((notif) => notif.id || 0));
  return maxId + 1;
};

// ✅ Inscription d'un nouvel utilisateur avec QR Code et code de parrainage
exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse, role = "client", recaptchaToken, isCustomCaptchaVerified, referralCode } = req.body;

    console.log("Données reçues dans /register :", { nom, email, role, referralCode, recaptchaToken, isCustomCaptchaVerified });

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
      console.log("Échec de la vérification reCAPTCHA v3 :", recaptchaResult);
      return res.status(400).json({
        message: "Échec de la vérification reCAPTCHA.",
        error: recaptchaResult.error || "Score trop bas ou erreur réseau.",
      });
    }

    if (!isCustomCaptchaVerified) {
      console.log("Affichage obligatoire du CAPTCHA personnalisé pour renforcer la sécurité.");
      return res.status(400).json({ message: "Vérification supplémentaire requise.", showCustomCaptcha: true });
    }

    if (!["client", "marchand"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    // Récupérer les domaines acceptés à partir de la collection shops
    const shops = await Shop.find();
    const allowedDomains = shops.map((shop) => `@${shop.merchantId}.com`).filter((domain) => domain);

    // Validation de l'email pour les marchands
    if (role === "marchand") {
      const emailDomain = email.toLowerCase().split('@')[1];
      if (!allowedDomains.some((domain) => emailDomain === domain.slice(1))) {
        return res.status(400).json({ message: `❌ Vous devez être un marchand d'une boutique enregistrée (email doit se terminer par ${allowedDomains.join(', ')}) !` });
      }
    }

    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newUserReferralCode = await generateReferralCode(nom);
    console.log("Nouveau code de parrainage généré pour l'utilisateur :", newUserReferralCode);

    let referredBy = null;
    let referrerName = null;
    if (referralCode) {
      console.log("Vérification du code de parrainage fourni :", referralCode);
      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        console.log("Code de parrainage invalide :", referralCode);
        return res.status(400).json({ message: "Code de parrainage invalide." });
      }
      referredBy = referrer._id;
      referrerName = referrer.nom;
      console.log("Parrain trouvé :", { id: referredBy, nom: referrerName });
    } else {
      console.log("Aucun code de parrainage fourni.");
    }

    // Extraire merchantId pour les marchands
    let merchantId = null;
    if (role === "marchand") {
      const emailDomain = email.split('@')[1].split('.')[0];
      merchantId = emailDomain;
    }

    const newUser = new User({
      nom,
      email,
      motDePasse: hashedPassword,
      role,
      referralCode: newUserReferralCode,
      referrals: [],
      referredBy,
      referralValidated: referredBy ? true : false,
      referralRewards: [],
      loyaltyPoints: 0,
      notifications: [],
      merchantId,
      isActive: true,
    });

    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, { $push: { referrals: newUser._id } });
      console.log("Utilisateur ajouté à la liste des filleuls du parrain :", referredBy);

      const referrer = await User.findById(referredBy);
      referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + 50;
      referrer.referralRewards.push({
        filleulId: newUser._id,
        pointsEarned: 50,
        date: new Date(),
      });

      referrer.notifications = referrer.notifications || [];
      const referrerNotificationId = generateNotificationId(referrer.notifications);
      referrer.notifications.push({
        id: referrerNotificationId,
        message: `Félicitations, ${referrer.nom} ! ${nom} s'est inscrit avec votre code de parrainage, et vous avez gagné 50 points !`,
        read: false,
        date: new Date(),
      });
      await referrer.save();
      console.log(`Récompense et notification attribuées à ${referrer.nom} : 50 points`);

      newUser.loyaltyPoints = 20;
      newUser.referralRewards.push({
        filleulId: referrer._id,
        pointsEarned: 20,
        date: new Date(),
      });
      const newUserNotificationId = generateNotificationId(newUser.notifications);
      newUser.notifications.push({
        id: newUserNotificationId,
        message: `Bienvenue, ${nom} ! Vous avez gagné 20 points de bienvenue grâce au parrainage de ${referrer.nom} !`,
        read: false,
        date: new Date(),
      });
    }

    await newUser.save();
    console.log("Nouvel utilisateur enregistré :", newUser._id);

    const qrCodeData = await QRCode.toDataURL(`http://192.168.43.57:3000/profile/${newUser._id}`);
    newUser.qrCode = qrCodeData;
    await newUser.save();
    console.log("QR Code généré et sauvegardé pour l'utilisateur :", newUser._id);

    const responseData = {
      message: "Compte créé avec succès !",
      user: newUser,
      qrCode: qrCodeData,
      referralCode: newUser.referralCode,
      referredBy: referredBy ? true : false,
      referrerName: referrerName || null,
    };

    console.log("Réponse envoyée à l'frontend :", responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error("❌ Erreur d'inscription :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Connexion avec JWT
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });

    if (!user.isActive) {
      return res.status(403).json({ message: "Compte désactivé." });
    }

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect." });

    let merchantId = null;
    if (user.role === "marchand") {
      merchantId = user.merchantId;
      if (!merchantId) {
        const emailDomain = email.split('@')[1];
        merchantId = emailDomain.split('.')[0];
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const tokenPayload = {
      userId: user._id,
      role: user.role,
      merchantId: merchantId || null,
    };

    if (user.role === "admin") {
      tokenPayload.adminPermissions = user.adminPermissions || [];
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    if (user.role !== "admin" && user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.notifications = referrer.notifications || [];
        const referrerNotificationId = generateNotificationId(referrer.notifications);
        referrer.notifications.push({
          id: referrerNotificationId,
          message: `${user.nom} s'est connecté avec votre code de parrainage !`,
          read: false,
          date: new Date(),
        });
        await referrer.save();
        console.log(`Notification attribuée à ${referrer.nom} : Connexion de ${user.nom}`);
      }
    }

    console.log("✅ Token généré lors de la connexion :", token);

    const responseData = {
      message: "Connexion réussie !",
      data: {
        token,
        user: {
          userId: user._id,
          nom: user.nom,
          email: user.email,
          role: user.role,
          merchantId: merchantId || null,
        },
      },
    };

    if (user.role === "admin") {
      responseData.data.user.adminPermissions = user.adminPermissions || [];
      responseData.data.user.lastLogin = user.lastLogin;
    } else {
      responseData.data.user.notifications = user.notifications || [];
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Erreur de connexion :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Vérifier si un utilisateur existe par email
exports.checkUserExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email requis." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });

    res.json({ exists: true, user });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'utilisateur :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les points de fidélité
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    res.status(200).json({ loyaltyPoints: user.loyaltyPoints });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des points de fidélité :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les badges d'un utilisateur
// Backend - Fonction getBadges modifiée avec les points bonus
exports.getBadges = async (req, res) => {
  try {
    let tempId = req.query.tempId;

    // Si aucun tempId, générer un nouvel ObjectId
    if (!tempId) {
      tempId = new mongoose.Types.ObjectId();
      const tempUser = new User({
        _id: tempId,
        email: `temp-${tempId}@example.com`,
        motDePasse: 'temporary',
        nom: 'Utilisateur Temporaire',
        role: 'client',
        totalScans: 0,
        scannedQrCodes: [],
        scanDates: [],
        visitedScreens: [],
        badgesEarned: {
          "Premier Pas": false,
          "Scanneur Assidu": false,
          "Utilisateur Quotidien": false,
          "Explorateur": false,
          "Marathonien": false
        }
      });
      await tempUser.save();
    }

    // Vérifier si tempId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(tempId)) {
      return res.status(400).json({ message: "tempId invalide." });
    }

    const user = await User.findById(tempId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    // Calculer les jours consécutifs
    const sortedDates = user.scanDates.sort();
    let consecutiveDays = 1;
    let maxConsecutiveDays = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        consecutiveDays++;
        maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
      } else {
        consecutiveDays = 1;
      }
    }

    const badges = [
      {
        name: "Premier Pas",
        description: "Scannez votre premier QR Code",
        earned: user.badgesEarned["Premier Pas"] || false,
        progress: user.totalScans >= 1 ? "1/1" : `${user.totalScans}/1`,
        bonusPoints: 50,
        bonusDescription: "+50 points de fidélité"
      },
      {
        name: "Scanneur Assidu",
        description: "Scannez 5 QR Codes différents",
        earned: user.badgesEarned["Scanneur Assidu"] || false,
        progress: `${user.scannedQrCodes.length}/5`,
        bonusPoints: 100,
        bonusDescription: "+100 points de fidélité"
      },
      {
        name: "Utilisateur Quotidien",
        description: "Scannez un QR Code 3 jours consécutifs",
        earned: user.badgesEarned["Utilisateur Quotidien"] || false,
        progress: `${maxConsecutiveDays}/3 jours`,
        bonusPoints: 150,
        bonusDescription: "+150 points de fidélité"
      },
      {
        name: "Explorateur",
        description: "Visitez tous les écrans de l'application",
        earned: user.badgesEarned["Explorateur"] || false,
        progress: `${user.visitedScreens.length}/3 écrans`,
        bonusPoints: 75,
        bonusDescription: "+75 points de fidélité"
      },
      {
        name: "Marathonien",
        description: "Scannez 10 QR Codes au total",
        earned: user.badgesEarned["Marathonien"] || false,
        progress: `${user.totalScans}/10`,
        bonusPoints: 250,
        bonusDescription: "+250 points de fidélité"
      }
    ];

    res.json({ badges, tempId });
  } catch (error) {
    console.error("❌ Erreur dans getBadges :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Mettre à jour les badges
exports.updateBadges = async (req, res) => {
  try {
    const tempId = req.body.tempId || req.query.tempId || req.body.userId;
    if (!tempId) return res.status(400).json({ message: "tempId ou userId est requis." });

    if (!mongoose.Types.ObjectId.isValid(tempId)) {
      return res.status(400).json({ message: "tempId ou userId invalide." });
    }

    const { action, orderId, screen } = req.body;
    if (!action) return res.status(400).json({ message: "Action est requise." });

    let user = await User.findById(tempId);
    if (!user) {
      // Créer un utilisateur temporaire si non existant
      user = new User({
        _id: tempId,
        email: `temp-${tempId}@example.com`,
        motDePasse: 'temporary',
        nom: 'Utilisateur Temporaire',
        role: 'client',
        totalScans: 0,
        scannedQrCodes: [],
        scanDates: [],
        visitedScreens: [],
        badgesEarned: {
          "Premier Pas": false,
          "Scanneur Assidu": false,
          "Utilisateur Quotidien": false,
          "Explorateur": false,
          "Marathonien": false
        }
      });
    }

    if (action === "scan" && orderId) {
      user.totalScans = (user.totalScans || 0) + 1;
      if (!user.scannedQrCodes.includes(orderId)) {
        user.scannedQrCodes.push(orderId);
      }
      const currentDate = new Date().toISOString().split("T")[0];
      if (!user.scanDates.includes(currentDate)) {
        user.scanDates.push(currentDate);
      }
    } else if (action === "visitScreen" && screen) {
      if (!user.visitedScreens.includes(screen)) {
        user.visitedScreens.push(screen);
      }
    } else {
      return res.status(400).json({ message: "Action invalide." });
    }

    // Calculer les jours consécutifs
    const sortedDates = user.scanDates.sort();
    let consecutiveDays = 1;
    let maxConsecutiveDays = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        consecutiveDays++;
        maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
      } else {
        consecutiveDays = 1;
      }
    }

    // Mettre à jour les badges
    if (!user.badgesEarned["Premier Pas"] && user.totalScans >= 1) {
      user.badgesEarned["Premier Pas"] = true;
    }
    if (!user.badgesEarned["Scanneur Assidu"] && user.scannedQrCodes.length >= 5) {
      user.badgesEarned["Scanneur Assidu"] = true;
    }
    if (!user.badgesEarned["Utilisateur Quotidien"] && maxConsecutiveDays >= 3) {
      user.badgesEarned["Utilisateur Quotidien"] = true;
    }
    if (
      !user.badgesEarned["Explorateur"] &&
      user.visitedScreens.includes("Rewards") &&
      user.visitedScreens.includes("Badges") &&
      user.visitedScreens.includes("ConvertRewards")
    ) {
      user.badgesEarned["Explorateur"] = true;
    }
    if (!user.badgesEarned["Marathonien"] && user.totalScans >= 10) {
      user.badgesEarned["Marathonien"] = true;
    }

    await user.save();
    res.json({ message: "Badges mis à jour avec succès." });
  } catch (error) {
    console.error("❌ Erreur dans updateBadges :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Gérer le scan du QR Code
function toValidDate(date) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  if (typeof date === "string" || typeof date === "number") {
    const d = new Date(date);
    return !isNaN(d.getTime()) ? d : null;
  }
  return null;
}

function dateToString(date) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  return null;
}

exports.handleQrCodeScan = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { orderId } = req.query;
    const testDate = req.query.testDate || req.query['amp;testDate'];

    console.log("🔍 Debug - req.query:", req.query);
    console.log("🔍 Debug - orderId:", orderId);
    console.log("🔍 Debug - testDate:", testDate);

    if (!orderId) return res.status(400).json({ message: "orderId est requis." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.scannedQrCodes = user.scannedQrCodes || [];
    user.scanDates = user.scanDates || [];
    user.badgesEarned = user.badgesEarned || {};
    user.visitedScreens = user.visitedScreens || [];
    user.loyaltyProgress = user.loyaltyProgress || {};

    user.scanDates = user.scanDates.filter(dateStr => {
      return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    });

    user.totalScans = (user.totalScans || 0) + 1;

    if (!user.scannedQrCodes.includes(orderId)) {
      user.scannedQrCodes.push(orderId);
    }

    let currentDateStr;
    let currentDate;

    if (testDate) {
      console.log("🔍 Debug - testDate reçu:", testDate);
      currentDate = toValidDate(testDate);
      if (!currentDate || isNaN(currentDate.getTime())) {
        return res.status(400).json({ message: "Date testDate invalide." });
      }
      currentDateStr = dateToString(currentDate);
    } else {
      currentDate = new Date();
      currentDateStr = dateToString(currentDate);
    }

    if (!currentDateStr) {
      return res.status(400).json({ message: "Erreur de formatage de la date." });
    }

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const hasCurrentMonth = user.scanDates.some(dateStr => {
      const date = toValidDate(dateStr);
      if (!date) return false;
      return (date.getMonth() + 1) === currentMonth && date.getFullYear() === currentYear;
    });

    let isNewDate = false;
    if (!user.scanDates.includes(currentDateStr)) {
      user.scanDates.push(currentDateStr);
      isNewDate = true;
    }

    const isPurchase = true;
    if (isPurchase) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + 10;
      user.loyaltyProgress.purchaseCount = (user.loyaltyProgress.purchaseCount || 0) + 1;
      user.loyaltyProgress.totalPoints = user.loyaltyPoints;

      if (!hasCurrentMonth && isNewDate) {
        user.loyaltyProgress.uniquePurchaseMonths = (user.loyaltyProgress.uniquePurchaseMonths || 0) + 1;
      }
    }

    if (!user.badgesEarned["Premier Pas"] && user.totalScans >= 1) {
      user.badgesEarned["Premier Pas"] = true;
    }
    if (!user.badgesEarned["Scanneur Assidu"] && user.scannedQrCodes.length >= 5) {
      user.badgesEarned["Scanneur Assidu"] = true;
    }
    if (!user.badgesEarned["Utilisateur Quotidien"] && user.totalScans >= 3) {
      user.badgesEarned["Utilisateur Quotidien"] = true;
    }
    if (
      !user.badgesEarned["Explorateur"] &&
      user.visitedScreens.includes("Rewards") &&
      user.visitedScreens.includes("Badges") &&
      user.visitedScreens.includes("ConvertRewards")
    ) {
      user.badgesEarned["Explorateur"] = true;
    }
    if (!user.badgesEarned["Marathonien"] && user.totalScans >= 10) {
      user.badgesEarned["Marathonien"] = true;
    }

    await user.save();
    await updateLoyaltyLevel(user);

    res.status(200).json({
      message: "Scan enregistré, points ajoutés.",
      loyaltyPoints: user.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
      loyaltyProgress: user.loyaltyProgress,
      totalScans: user.totalScans,
      scannedQrCodes: user.scannedQrCodes,
      scanDates: user.scanDates
    });
  } catch (error) {
    console.error("❌ Erreur dans handleQrCodeScan :", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mot de passe oublié
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email non trouvé." });

    const resetToken = Math.random().toString(36).slice(2);
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://192.168.43.57:3000/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe - LoyaltyHub Pro",
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour ${user.nom},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <a href="${resetLink}">Réinitialiser mon mot de passe</a>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <p>L'équipe LoyaltyHub Pro</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email de réinitialisation envoyé." });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token et nouveau mot de passe requis." });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token invalide ou expiré." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.motDePasse = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les données d’un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "ID d’utilisateur invalide." });

    const user = await User.findById(userId).select("-motDePasse");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    await updateLoyaltyLevel(user);

    res.status(200).json({
      userId: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      qrCode: user.qrCode,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
      loyaltyProgress: user.loyaltyProgress || {},
      totalScans: user.totalScans || 0,
      scannedQrCodes: user.scannedQrCodes || [],
      scanDates: user.scanDates || [],
      badgesEarned: user.badgesEarned || {},
      notifications: user.notifications || [],
      referrals: user.referrals || [],
      referralRewards: user.referralRewards || [],
      isActive: user.isActive,
      merchantId: user.merchantId || null,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l’utilisateur :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer le code de parrainage de l'utilisateur
exports.getReferralCode = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (!user.referralCode) {
      user.referralCode = await generateReferralCode(user.nom);
      await user.save();
    }

    res.status(200).json({
      message: "Code de parrainage récupéré avec succès.",
      referralCode: user.referralCode,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du code de parrainage :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Envoyer le code de parrainage par email
exports.sendReferralEmail = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { recipientEmail } = req.body;
    if (!recipientEmail) return res.status(400).json({ message: "Adresse email du destinataire requise." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    const referralCode = user.referralCode;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: "Rejoins LoyaltyHub Pro avec mon code de parrainage !",
      html: `
        <h1>Rejoins LoyaltyHub Pro !</h1>
        <p>Bonjour,</p>
        <p>${user.nom} t'invite à rejoindre LoyaltyHub Pro ! Utilise le code de parrainage suivant pour t'inscrire et gagner 20 points de fidélité :</p>
        <p><strong>${referralCode}</strong></p>
        <p><a href="http://192.168.43.57:3000/register">Inscris-toi ici</a></p>
        <p>L'équipe LoyaltyHub Pro</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email envoyé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email de parrainage :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les notifications d'un utilisateur
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    res.status(200).json({ notifications: user.notifications || [] });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des notifications :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Marquer une notification comme lue
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ message: "notificationId requis." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.notifications = user.notifications.map((notif) =>
      notif.id === parseInt(notificationId) ? { ...notif, read: true } : notif
    );
    await user.save();
    res.status(200).json({ message: "Notification marquée comme lue." });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la notification :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ message: "notificationId requis." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.notifications = user.notifications.filter((notif) => notif.id !== parseInt(notificationId));
    await user.save();
    res.status(200).json({ message: "Notification supprimée." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la notification :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Lister tous les utilisateurs (réservée aux admins)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query; // Nouveau: Filtre par rôle
    const filter = role ? { role } : {};
    const users = await User.find(filter, '-motDePasse');
    res.json(users);
  } catch (error) {
    console.error("Erreur DB:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Créer un utilisateur (réservée aux admins)
exports.createUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role, referredBy } = req.body;

    // 1. Validation des données
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ 
        success: false,
        message: "Nom, email et mot de passe sont obligatoires" 
      });
    }

    // 2. Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Un utilisateur avec cet email existe déjà" 
      });
    }

    // 3. Création du nouvel utilisateur
    const newUser = new User({
      nom,
      email,
      motDePasse, // Le middleware de pré-save hash automatiquement
      role: role || "client", // Par défaut 'client' si non spécifié
      isActive: true,
      referredBy: referredBy || null
    });

    // 4. Génération des identifiants spécifiques
    if (newUser.role === "client") {
      // Utilisation de votre fonction existante pour le code de parrainage
      newUser.referralCode = await generateReferralCode(nom);
      newUser.qrCode = `HC-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
    } 
    else if (newUser.role === "marchand") {
      newUser.merchantId = `MCH-${Date.now().toString(36).toUpperCase()}`;
    }

    // 5. Gestion du parrainage si applicable
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (referrer) {
        referrer.referrals.push(newUser._id);
        referrer.referralRewards.push({
          filleulId: newUser._id,
          pointsEarned: 100, // Points à configurer
          date: new Date()
        });
        await referrer.save();
      }
    }

    // 6. Sauvegarde finale
    await newUser.save();

    // 7. Réponse réussie
    const responseData = {
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        _id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    };

    // Ajout des champs spécifiques selon le rôle
    if (newUser.role === "client") {
      responseData.user.referralCode = newUser.referralCode;
      responseData.user.qrCode = newUser.qrCode;
    } 
    else if (newUser.role === "marchand") {
      responseData.user.merchantId = newUser.merchantId;
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors
      });
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'utilisateur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Modifier un utilisateur (réservée aux admins)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Supprimer les champs sensibles que l'admin ne peut pas modifier directement
    delete updateData.motDePasse;
    delete updateData._id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-motDePasse' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Suspendre/activer un utilisateur (réservée aux admins)
exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params; // Changé de req.body à req.params
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `Utilisateur ${user.isActive ? 'activé' : 'suspendu'} avec succès`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Erreur lors de la modification du statut:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Fonction utilitaire pour mettre à jour le niveau de fidélité
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
      totalPoints,
      purchaseCount,
      uniquePurchaseMonths,
      successfulReferrals,
      lastLevelUpdate: new Date(),
    };
    await user.save();
    console.log(`Niveau mis à jour pour ${user.nom} : ${newLevel}`);
  } else {
    user.loyaltyProgress = {
      totalPoints,
      purchaseCount,
      uniquePurchaseMonths,
      successfulReferrals,
      lastLevelUpdate: user.loyaltyProgress?.lastLevelUpdate || new Date(),
    };
    await user.save();
  }
};

// ✅ Notifier le parrain
exports.notifyReferrer = async (req, res) => {
  try {
    const { referrerId, newUserName, referrerName } = req.body;

    if (!referrerId || !newUserName || !referrerName) {
      return res.status(400).json({ message: "referrerId, newUserName et referrerName sont requis." });
    }

    const referrer = await User.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({ message: "Parrain non trouvé." });
    }

    res.status(200).json({ message: "Notification pour le parrain désactivée." });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification au parrain :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Ajouter un achat
exports.addPurchase = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { points, merchantId } = req.body;
    if (!points || isNaN(points) || points <= 0 || !merchantId) {
      return res.status(400).json({ message: "Points et merchantId requis." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    user.loyaltyProgress = user.loyaltyProgress || {};
    user.loyaltyProgress.purchaseCount = (user.loyaltyProgress.purchaseCount || 0) + 1;
    user.loyaltyProgress.totalPoints = user.loyaltyPoints;
    user.scanDates = user.scanDates || [];
    user.scanDates.push(new Date().toISOString().split("T")[0]);

    const currentMonth = new Date().getMonth() + 1;
    if (!user.scanDates.some(date => new Date(date).getMonth() + 1 === currentMonth)) {
      user.loyaltyProgress.uniquePurchaseMonths = (user.loyaltyProgress.uniquePurchaseMonths || 0) + 1;
    }

    user.loyaltyProgress.merchantLoyalty = user.loyaltyProgress.merchantLoyalty || [];
    let merchantLoyalty = user.loyaltyProgress.merchantLoyalty.find(ml => ml.merchantId === merchantId);
    if (merchantLoyalty) {
      merchantLoyalty.purchaseCount += 1;
      merchantLoyalty.lastOrderDate = new Date();
      merchantLoyalty.loyaltyLevel = calculateMerchantLoyaltyLevel(merchantLoyalty.purchaseCount);
    } else {
      user.loyaltyProgress.merchantLoyalty.push({
        merchantId,
        purchaseCount: 1,
        loyaltyLevel: "Bronze",
        lastOrderDate: new Date(),
      });
    }

    await user.save();
    await updateLoyaltyLevel(user);

    res.status(200).json({
      message: "Achat enregistré, niveau mis à jour.",
      loyaltyPoints: user.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout d'un achat :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Calculer le niveau de fidélité marchand
const calculateMerchantLoyaltyLevel = (purchaseCount) => {
  if (purchaseCount > 5) return "Or";
  if (purchaseCount >= 3) return "Argent";
  return "Bronze";
};

// ✅ Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.params.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { nom, email } = req.body;
    if (!nom || !email) return res.status(400).json({ message: "Nom et email sont requis." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (email !== user.email && user.role === "marchand") {
      const shops = await Shop.find();
      const allowedDomains = shops.map((shop) => `@${shop.merchantId}.com`);
      const emailDomain = email.toLowerCase().split('@')[1];
      if (!allowedDomains.some((domain) => emailDomain === domain.slice(1))) {
        return res.status(400).json({
          message: `L'email doit se terminer par l'un des domaines suivants : ${allowedDomains.join(', ')}.`,
        });
      }
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    user.nom = nom;
    user.email = email;

    if (nom !== user.nom) {
      user.referralCode = await generateReferralCode(nom);
    }

    await user.save();

    res.status(200).json({
      message: "Profil mis à jour avec succès.",
      nom: user.nom,
      email: user.email,
      userId: user._id,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les clients d'un marchand
exports.getMerchantCustomers = async (req, res) => {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) return res.status(401).json({ message: "Marchand non authentifié." });

    const customers = await User.find({
      "loyaltyProgress.merchantLoyalty.merchantId": merchantId,
    }).select("nom loyaltyPoints loyaltyProgress.merchantLoyalty");

    const customerData = customers.map(customer => {
      const merchantLoyalty = customer.loyaltyProgress.merchantLoyalty.find(
        ml => ml.merchantId === merchantId
      );
      return {
        userId: customer._id,
        nom: customer.nom,
        loyaltyPoints: customer.loyaltyPoints,
        orderCount: merchantLoyalty?.purchaseCount || 0,
        lastOrderDate: merchantLoyalty?.lastOrderDate,
        status: merchantLoyalty?.loyaltyLevel || "Bronze",
      };
    });

    res.status(200).json({
      message: "Clients récupérés avec succès.",
      customers: customerData,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des clients :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Ajouter des points de fidélité depuis un puzzle
exports.addLoyaltyPointsFromPuzzle = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log("Requête reçue. UserId:", userId);
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { points, level } = req.body;
    console.log("Données reçues:", { points, level });
    if (!points || isNaN(points) || points <= 0 || !level) {
      return res.status(400).json({ message: "Points et niveau requis." });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    console.log("Points avant mise à jour:", user.loyaltyPoints);
    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    user.loyaltyProgress = user.loyaltyProgress || {};
    user.loyaltyProgress.totalPoints = user.loyaltyPoints;

    const notificationId = generateNotificationId(user.notifications);
    user.notifications.push({
      id: notificationId,
      message: `Félicitations ! Vous avez gagné ${points} points de fidélité en complétant le niveau ${level} du puzzle !`,
      read: false,
      date: new Date(),
    });

    const savedUser = await user.save();
    console.log("Points après sauvegarde:", savedUser.loyaltyPoints);

    await updateLoyaltyLevel(user);

    res.status(200).json({
      message: "Points de fidélité ajoutés avec succès.",
      loyaltyPoints: savedUser.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des points:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Ajouter des points de fidélité depuis Treasure Dig
exports.addLoyaltyPointsFromTreasureDig = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log("Requête reçue pour TreasureDig. UserId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { points } = req.body;
    console.log("Données reçues:", { points });
    console.log("Corps de la requête complet:", req.body);
    console.log("Type de points:", typeof points);
    console.log("Valeur de points:", points);

    if (!points || isNaN(Number(points)) || Number(points) <= 0) {
      console.log("❌ Validation échouée - Points invalides:", points);
      return res.status(400).json({
        message: "Points requis et doivent être un nombre positif."
      });
    }

    const pointsToAdd = Number(points);

    let user = await User.findById(userId);
    if (!user) {
      console.log("❌ Utilisateur non trouvé:", userId);
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    console.log("✅ Utilisateur trouvé:", user._id);
    console.log("Points avant mise à jour:", user.loyaltyPoints);

    user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
    user.loyaltyProgress = user.loyaltyProgress || {};
    user.loyaltyProgress.totalPoints = user.loyaltyPoints;

    const notificationId = generateNotificationId(user.notifications);
    user.notifications.push({
      id: notificationId,
      message: `Félicitations ! Vous avez gagné ${pointsToAdd} points de fidélité en jouant à Treasure Dig !`,
      read: false,
      date: new Date(),
    });

    console.log("Sauvegarde de l'utilisateur...");
    const savedUser = await user.save();
    console.log("✅ Points après sauvegarde:", savedUser.loyaltyPoints);

    console.log("Mise à jour du niveau de fidélité...");
    await updateLoyaltyLevel(savedUser);

    res.status(200).json({
      success: true,
      message: "Points de fidélité ajoutés avec succès depuis Treasure Dig.",
      loyaltyPoints: savedUser.loyaltyPoints,
      loyaltyLevel: savedUser.loyaltyLevel,
      pointsAdded: pointsToAdd
    });

    console.log("✅ Opération terminée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des points depuis TreasureDig:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout des points de fidélité",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ✅ Ajouter des points de fidélité depuis Treasure Hunter Memory
exports.addLoyaltyPointsFromTreasureHunterMemory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const { points } = req.body;
    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({ message: "Points requis." });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    user.loyaltyProgress = user.loyaltyProgress || {};
    user.loyaltyProgress.totalPoints = user.loyaltyPoints;

    const notificationId = generateNotificationId(user.notifications);
    user.notifications.push({
      id: notificationId,
      message: `Félicitations ! Vous avez gagné ${points} points de fidélité en jouant à Treasure Hunter Memory !`,
      read: false,
      date: new Date(),
    });

    const savedUser = await user.save();
    await updateLoyaltyLevel(savedUser); // Correction : Appel de updateLoyaltyLevel

    res.status(200).json({
      message: "Points de fidélité ajoutés avec succès depuis Treasure Hunter Memory.",
      loyaltyPoints: savedUser.loyaltyPoints,
      loyaltyLevel: savedUser.loyaltyLevel,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des points depuis TreasureHunterMemory:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
exports.addLoyaltyPointsFromBadge = async (req, res) => {
  try {
    const { tempId, badgeName } = req.body;
    console.log("Requête reçue. TempId:", tempId, "Badge:", badgeName);
    
    if (!tempId || !badgeName) {
      return res.status(400).json({ message: "TempId et badgeName requis." });
    }

    // Vérifier si tempId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(tempId)) {
      return res.status(400).json({ message: "TempId invalide." });
    }

    let user = await User.findById(tempId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    // Définir les points bonus pour chaque badge
    const badgeRewards = {
      "Premier Pas": 50,
      "Scanneur Assidu": 100,
      "Utilisateur Quotidien": 150,
      "Explorateur": 75,
      "Marathonien": 250
    };

    const bonusPoints = badgeRewards[badgeName];
    if (!bonusPoints) {
      return res.status(400).json({ message: "Badge invalide." });
    }

    // Vérifier si le badge n'a pas déjà été obtenu
    if (user.badgesEarned[badgeName]) {
      return res.status(400).json({ message: "Badge déjà obtenu." });
    }

    console.log("Points avant mise à jour:", user.loyaltyPoints);
    
    // Ajouter les points bonus
    user.loyaltyPoints = (user.loyaltyPoints || 0) + bonusPoints;
    user.loyaltyProgress = user.loyaltyProgress || {};
    user.loyaltyProgress.totalPoints = user.loyaltyPoints;

    // Marquer le badge comme obtenu
    user.badgesEarned[badgeName] = true;

    // Ajouter une notification
    const notificationId = generateNotificationId(user.notifications);
    user.notifications.push({
      id: notificationId,
      message: `Félicitations ! Vous avez obtenu le badge "${badgeName}" et gagné ${bonusPoints} points de fidélité !`,
      read: false,
      date: new Date(),
    });

    const savedUser = await user.save();
    console.log("Points après sauvegarde:", savedUser.loyaltyPoints);

    // Mettre à jour le niveau de fidélité
    await updateLoyaltyLevel(user);

    res.status(200).json({
      message: "Badge obtenu et points ajoutés avec succès.",
      loyaltyPoints: savedUser.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
      badgeName: badgeName,
      bonusPoints: bonusPoints
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des points de badge:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

console.log("Exports dans authController.js :", exports);