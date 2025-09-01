const Badge = require('../models/Badge');

// Récupérer les badges d'un utilisateur
exports.getBadges = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId est requis" });
    }

    let badgeData = await Badge.findOne({ userId });
    if (!badgeData) {
      badgeData = new Badge({
        userId,
        totalScans: 0,
        scannedQrCodes: [],
        scanDates: [],
        visitedScreens: [],
        badgesEarned: {
          "Premier Pas": false,
          "Scanneur Assidu": false,
          "Utilisateur Quotidien": false,
          "Explorateur": false,
          "Marathonien": false,
        },
      });
      await badgeData.save();
    }

    // Calculer la progression pour "Utilisateur Quotidien"
    const sortedDates = badgeData.scanDates.sort();
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
        earned: badgeData.badgesEarned["Premier Pas"],
        progress: badgeData.totalScans >= 1 ? "1/1" : `${badgeData.totalScans}/1`,
      },
      {
        name: "Scanneur Assidu",
        description: "Scannez 5 QR Codes différents",
        earned: badgeData.badgesEarned["Scanneur Assidu"],
        progress: `${badgeData.scannedQrCodes.length}/5`,
      },
      {
        name: "Utilisateur Quotidien",
        description: "Scannez un QR Code 3 jours consécutifs",
        earned: badgeData.badgesEarned["Utilisateur Quotidien"],
        progress: `${maxConsecutiveDays}/3 jours`,
      },
      {
        name: "Explorateur",
        description: "Visitez tous les écrans de l'application",
        earned: badgeData.badgesEarned["Explorateur"],
        progress: `${badgeData.visitedScreens.length}/3 écrans`,
      },
      {
        name: "Marathonien",
        description: "Scannez 10 QR Codes au total",
        earned: badgeData.badgesEarned["Marathonien"],
        progress: `${badgeData.totalScans}/10`,
      },
    ];

    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour les badges (ajouter un scan ou une visite d'écran)
exports.updateBadges = async (req, res) => {
  try {
    const { userId, action, orderId, screen } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ message: "userId et action sont requis" });
    }

    let badgeData = await Badge.findOne({ userId });
    if (!badgeData) {
      badgeData = new Badge({
        userId,
        totalScans: 0,
        scannedQrCodes: [],
        scanDates: [],
        visitedScreens: [],
        badgesEarned: {
          "Premier Pas": false,
          "Scanneur Assidu": false,
          "Utilisateur Quotidien": false,
          "Explorateur": false,
          "Marathonien": false,
        },
      });
    }

    if (action === "scan" && orderId) {
      badgeData.totalScans += 1;
      if (!badgeData.scannedQrCodes.includes(orderId)) {
        badgeData.scannedQrCodes.push(orderId);
      }
      const currentDate = new Date().toISOString().split("T")[0];
      if (!badgeData.scanDates.includes(currentDate)) {
        badgeData.scanDates.push(currentDate);
      }
    } else if (action === "visitScreen" && screen) {
      if (!badgeData.visitedScreens.includes(screen)) {
        badgeData.visitedScreens.push(screen);
      }
    } else {
      return res.status(400).json({ message: "Action invalide" });
    }

    // Vérifier les conditions des badges
    if (!badgeData.badgesEarned["Premier Pas"] && badgeData.totalScans >= 1) {
      badgeData.badgesEarned["Premier Pas"] = true;
    }
    if (
      !badgeData.badgesEarned["Scanneur Assidu"] &&
      badgeData.scannedQrCodes.length >= 5
    ) {
      badgeData.badgesEarned["Scanneur Assidu"] = true;
    }
    if (
      !badgeData.badgesEarned["Utilisateur Quotidien"] &&
      badgeData.scanDates.length >= 3
    ) {
      const sortedDates = badgeData.scanDates.sort();
      let consecutiveDays = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          consecutiveDays++;
          if (consecutiveDays >= 3) {
            badgeData.badgesEarned["Utilisateur Quotidien"] = true;
            break;
          }
        } else {
          consecutiveDays = 1;
        }
      }
    }
    if (
      !badgeData.badgesEarned["Explorateur"] &&
      badgeData.visitedScreens.includes("Rewards") &&
      badgeData.visitedScreens.includes("Badges") &&
      badgeData.visitedScreens.includes("ConvertRewards")
    ) {
      badgeData.badgesEarned["Explorateur"] = true;
    }
    if (!badgeData.badgesEarned["Marathonien"] && badgeData.totalScans >= 10) {
      badgeData.badgesEarned["Marathonien"] = true;
    }

    await badgeData.save();
    res.json({ message: "Badges mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};