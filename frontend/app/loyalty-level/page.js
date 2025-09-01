"use client";
import { useState, useEffect } from "react";

const API_URL = "http://192.168.43.57:5000/api";

// Thème treasure hunt appliqué à vos niveaux existants
const LOYALTY_LEVELS = {
  Découvreur: {
    color: "bg-amber-100 text-amber-800",
    icon: "🏴‍☠️",
    treasureTitle: "Mousse",
    treasureIcon: "🗺️",
    conditions: "Niveau de départ - Embarquez pour l'aventure !",
    nextLevel: "Initié",
    benefits: ["Accès aux offres de base", "Support client prioritaire"],
    story: "Bienvenue à bord, moussaillon ! Votre aventure commence ici sur les sept mers.",
  },
  Initié: {
    color: "bg-blue-100 text-blue-800",
    icon: "⚓",
    treasureTitle: "Matelot",
    treasureIcon: "🔱",
    conditions: "1 achat OU 100 pièces d'or",
    nextLevel: "Fidèle",
    benefits: ["5% de réduction", "Accès aux offres exclusives", "Bonus de bienvenue"],
    story: "Vous avez prouvé votre valeur ! Les eaux profondes vous attendent, matelot.",
  },
  Fidèle: {
    color: "bg-green-100 text-green-800",
    icon: "🗡️",
    treasureTitle: "Quartier-Maître",
    treasureIcon: "⚔️",
    conditions: "500 pièces d'or + 3 achats + 3 mois d'activité",
    nextLevel: "VIP",
    benefits: ["10% de réduction", "Livraison gratuite", "Offres personnalisées", "Accès anticipé"],
    story: "Quartier-Maître respecté, votre loyauté ne passe pas inaperçue dans l'équipage.",
  },
  VIP: {
    color: "bg-purple-100 text-purple-800",
    icon: "🏆",
    treasureTitle: "Capitaine",
    treasureIcon: "🎖️",
    conditions: "2000 pièces d'or + 8 achats + 6 mois + 1 parrainage",
    nextLevel: "Ambassadeur",
    benefits: ["15% de réduction", "Support VIP 24/7", "Produits exclusifs", "Événements privés"],
    story: "Capitaine chevronné, vous menez votre navire vers des horizons dorés.",
  },
  Ambassadeur: {
    color: "bg-yellow-100 text-yellow-800",
    icon: "👑",
    treasureTitle: "Amiral",
    treasureIcon: "💎",
    conditions: "5000 pièces d'or + 15 achats + 12 mois + 3 parrainages",
    nextLevel: null,
    benefits: ["20% de réduction", "Concierge personnel", "Accès à la collection privée", "Invitations exclusives"],
    story: "Amiral légendaire, vous dominez les océans avec sagesse et prestige.",
  },
};

// Conseils pour progresser
const PROGRESS_TIPS = {
  loyaltyPoints: [
    "💡 Effectuez des achats réguliers pour gagner des pièces d'or",
    "🎁 Participez aux événements spéciaux pour des bonus",
    "📱 Utilisez l'app mobile pour des points supplémentaires",
  ],
  purchases: [
    "🛒 Planifiez vos achats groupés pour optimiser vos expéditions",
    "📦 Profitez des offres saisonnières",
    "🎯 Complétez votre collection pour des bonus",
  ],
  referrals: [
    "👥 Invitez vos amis à rejoindre l'aventure",
    "🎉 Partagez vos découvertes sur les réseaux sociaux",
    "💌 Utilisez votre code de parrainage personnel",
  ],
};

export default function LoyaltyLevel() {
  const [loyaltyLevel, setLoyaltyLevel] = useState("Fidèle");
  const [loyaltyPoints, setLoyaltyPoints] = useState(750);
  const [userStats, setUserStats] = useState({
    purchaseCount: 5,
    uniquePurchaseMonths: 4,
    successfulReferrals: 1,
  });
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchLoyaltyData = async () => {
    try {
      const userId = localStorage?.getItem("userId");
      const token = localStorage?.getItem("token");

      if (!userId || !token) {
        console.log("Pas d'utilisateur connecté, utilisation des données par défaut");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const data = await response.json();
      console.log("API Response:", data);

      setLoyaltyLevel(data.loyaltyLevel || "Découvreur");
      setLoyaltyPoints(data.loyaltyPoints || 0);

      const progress = data.loyaltyProgress || {};
      const scanDates = data.scanDates || [];
      const referrals = data.referrals || [];

      let uniquePurchaseMonths = progress.uniquePurchaseMonths;
      if (uniquePurchaseMonths === undefined || uniquePurchaseMonths === null) {
        uniquePurchaseMonths = new Set(
          scanDates
            .map((date) => {
              const d = new Date(date);
              return isNaN(d) ? null : `${d.getFullYear()}-${d.getMonth() + 1}`;
            })
            .filter((month) => month !== null)
        ).size;
        console.warn("⚠️ uniquePurchaseMonths manquant, calcul client:", uniquePurchaseMonths);
      }

      let successfulReferrals = progress.successfulReferrals;
      if (successfulReferrals === undefined || successfulReferrals === null) {
        successfulReferrals = referrals.length || 0;
        console.warn("⚠️ successfulReferrals manquant, calcul client:", successfulReferrals);
      }

      setUserStats({
        purchaseCount: progress.purchaseCount || 0,
        uniquePurchaseMonths,
        successfulReferrals,
      });

      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération du niveau :", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOrderConfirmed = () => {
      console.log("Événement orderConfirmed reçu, rafraîchissement des données...");
      fetchLoyaltyData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("orderConfirmed", handleOrderConfirmed);
      return () => window.removeEventListener("orderConfirmed", handleOrderConfirmed);
    }
  }, []);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const getNextLevelProgress = () => {
    const currentLevelInfo = LOYALTY_LEVELS[loyaltyLevel];
    if (!currentLevelInfo.nextLevel) return null;

    const nextLevel = currentLevelInfo.nextLevel;
    let conditions = [];
    let isEligible = false;

    switch (nextLevel) {
      case "Initié":
        conditions = [
          { label: "Achats", current: userStats.purchaseCount, required: 1, met: userStats.purchaseCount >= 1 },
          { label: "Pièces d'or", current: loyaltyPoints, required: 100, met: loyaltyPoints >= 100, isOr: true },
        ];
        isEligible = userStats.purchaseCount >= 1 || loyaltyPoints >= 100;
        break;
      case "Fidèle":
        conditions = [
          { label: "Pièces d'or", current: loyaltyPoints, required: 500, met: loyaltyPoints >= 500 },
          { label: "Achats", current: userStats.purchaseCount, required: 3, met: userStats.purchaseCount >= 3 },
          { label: "Mois d'activité", current: userStats.uniquePurchaseMonths, required: 3, met: userStats.uniquePurchaseMonths >= 3 },
        ];
        isEligible = loyaltyPoints >= 500 && userStats.purchaseCount >= 3 && userStats.uniquePurchaseMonths >= 3;
        break;
      case "VIP":
        conditions = [
          { label: "Pièces d'or", current: loyaltyPoints, required: 2000, met: loyaltyPoints >= 2000 },
          { label: "Achats", current: userStats.purchaseCount, required: 8, met: userStats.purchaseCount >= 8 },
          { label: "Mois d'activité", current: userStats.uniquePurchaseMonths, required: 6, met: userStats.uniquePurchaseMonths >= 6 },
          { label: "Parrainages", current: userStats.successfulReferrals, required: 1, met: userStats.successfulReferrals >= 1 },
        ];
        isEligible = loyaltyPoints >= 2000 && userStats.purchaseCount >= 8 && userStats.uniquePurchaseMonths >= 6 && userStats.successfulReferrals >= 1;
        break;
      case "Ambassadeur":
        conditions = [
          { label: "Pièces d'or", current: loyaltyPoints, required: 5000, met: loyaltyPoints >= 5000 },
          { label: "Achats", current: userStats.purchaseCount, required: 15, met: userStats.purchaseCount >= 15 },
          { label: "Mois d'activité", current: userStats.uniquePurchaseMonths, required: 12, met: userStats.uniquePurchaseMonths >= 12 },
          { label: "Parrainages", current: userStats.successfulReferrals, required: 3, met: userStats.successfulReferrals >= 3 },
        ];
        isEligible = loyaltyPoints >= 5000 && userStats.purchaseCount >= 15 && userStats.uniquePurchaseMonths >= 12 && userStats.successfulReferrals >= 3;
        break;
    }

    return { nextLevel, conditions, isEligible };
  };

  // Fonction pour obtenir l'ordre des niveaux
  const getLevelOrder = () => {
    return ["Découvreur", "Initié", "Fidèle", "VIP", "Ambassadeur"];
  };

  // Fonction pour vérifier si un niveau est atteint
  const isLevelReached = (level) => {
    const levelOrder = getLevelOrder();
    const currentIndex = levelOrder.indexOf(loyaltyLevel);
    const targetIndex = levelOrder.indexOf(level);
    return targetIndex <= currentIndex;
  };

  // Fonction pour obtenir le statut d'un niveau
  const getLevelStatus = (level) => {
    if (level === loyaltyLevel) return "current";
    return isLevelReached(level) ? "completed" : "pending";
  };

  const currentLevelInfo = LOYALTY_LEVELS[loyaltyLevel];
  const nextLevelProgress = getNextLevelProgress();
  const levelOrder = getLevelOrder();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 p-4"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          linear-gradient(45deg, rgba(244, 228, 188, 0.3) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(244, 228, 188, 0.3) 25%, transparent 25%)
        `,
        backgroundSize: "60px 60px, 60px 60px, 30px 30px, 30px 30px",
      }}
    >
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-amber-200 opacity-30 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-yellow-200 opacity-20"></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 rounded-full bg-amber-300 opacity-25"></div>
        <div className="absolute bottom-20 right-1/3 w-14 h-14 rounded-full bg-yellow-300 opacity-20"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-4 border-amber-700 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 shadow-xl opacity-80">
          <div className="absolute inset-2 border-2 border-amber-600 rounded-full flex items-center justify-center">
            <div className="text-amber-800 font-bold text-xs">N</div>
            <div className="absolute top-1 right-3 text-amber-700 text-xs">E</div>
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-amber-700 text-xs">S</div>
            <div className="absolute top-1/2 left-1 transform -translate-y-1/2 text-amber-700 text-xs">O</div>
          </div>
        </div>
        <div className="absolute bottom-32 left-20 w-32 h-16 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full opacity-60 shadow-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full opacity-50"></div>
        <div className="absolute bottom-36 left-28 text-4xl opacity-70">🌴</div>
        <div className="absolute bottom-44 left-40 text-3xl opacity-60">🌴</div>
        <div className="absolute top-40 right-32 text-3xl opacity-50">🌴</div>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-900 drop-shadow-lg">
            🏴‍☠️ Mon Niveau de Fidélité - Treasure Hunt
          </h1>

          {/* Progression visuelle sous forme de ligne */}
          <div className="bg-gradient-to-br from-amber-50/95 to-yellow-100/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border-4 border-amber-600">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-amber-900 flex items-center">
                <span className="mr-3">⚓</span>
                Votre Progression sur la Carte au Trésor
              </h2>
              <div className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-bold text-lg shadow-lg">
                💰 {loyaltyPoints} pièces d'or
              </div>
            </div>

            {/* Ligne de progression horizontale */}
            <div className="relative mb-8">
              {/* Ligne de fond */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-300 rounded-full transform -translate-y-1/2"></div>
              
              {/* Ligne de progression */}
              <div 
                className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-green-400 to-yellow-500 rounded-full transform -translate-y-1/2 transition-all duration-500"
                style={{ 
                  width: `${((levelOrder.indexOf(loyaltyLevel) + 1) / levelOrder.length) * 100}%` 
                }}
              ></div>

              {/* Points des niveaux */}
              <div className="flex justify-between relative">
                {levelOrder.map((level, index) => {
                  const status = getLevelStatus(level);
                  const levelInfo = LOYALTY_LEVELS[level];
                  
                  return (
                    <div key={level} className="flex flex-col items-center">
                      {/* Cercle du niveau */}
                      <div className={`
                        w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold shadow-lg z-10 transition-all duration-300
                        ${status === 'completed' ? 'bg-green-500 border-green-600 text-white' : 
                          status === 'current' ? 'bg-yellow-400 border-yellow-500 text-amber-900 animate-pulse' : 
                          'bg-gray-300 border-gray-400 text-gray-600'}
                      `}>
                        {status === 'completed' ? '✓' : 
                         status === 'current' ? levelInfo.treasureIcon : 
                         levelInfo.treasureIcon}
                      </div>
                      
                      {/* Nom du niveau */}
                      <div className={`
                        mt-3 text-center font-bold text-sm px-3 py-1 rounded-full
                        ${status === 'current' ? 'bg-yellow-200 text-amber-900' : 
                          status === 'completed' ? 'bg-green-200 text-green-800' : 
                          'bg-gray-200 text-gray-600'}
                      `}>
                        {levelInfo.treasureTitle}
                      </div>
                      
                      {/* Statut */}
                      {status === 'current' && (
                        <div className="mt-1 text-xs text-amber-700 font-semibold">
                          Position Actuelle
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation par onglets */}
          <div className="flex justify-center mb-6">
            <div className="bg-amber-50/90 backdrop-blur-sm rounded-xl p-2 border-2 border-amber-300">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
                    : "text-amber-700 hover:bg-amber-100"
                }`}
              >
                🎯 Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab("benefits")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ml-2 ${
                  activeTab === "benefits"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
                    : "text-amber-700 hover:bg-amber-100"
                }`}
              >
                🎁 Avantages
              </button>
              <button
      onClick={() => setActiveTab("ranks")}
      className={`px-6 py-2 rounded-lg font-semibold transition-all ml-2 ${
        activeTab === "ranks"
          ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
          : "text-amber-700 hover:bg-amber-100"
      }`}
    >
      🗺️ Tous les grades
    </button>
  </div>
</div>

          {activeTab === "overview" && (
            <>
              {/* Détails du niveau actuel */}
              <div className="bg-gradient-to-br from-amber-50/95 to-yellow-100/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border-4 border-amber-600">
                <div className="text-center mb-6">
                  <span className="text-6xl mb-4 block">{currentLevelInfo.treasureIcon}</span>
                  <h2 className="text-3xl font-bold text-amber-900 mb-2">{currentLevelInfo.treasureTitle}</h2>
                  <p className="text-amber-700 text-lg">{currentLevelInfo.story}</p>
                  <div className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full inline-block">
                    <span className="text-amber-900 font-bold text-xl">💰 {loyaltyPoints} Pièces d'Or dans votre Coffre</span>
                  </div>
                </div>

                {/* Statistiques en grille */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-yellow-100 to-amber-200 rounded-xl p-4 text-center border-2 border-amber-300 shadow-lg">
                    <div className="text-3xl font-bold text-amber-700">💰{loyaltyPoints}</div>
                    <div className="text-sm text-amber-800 font-semibold">Pièces d'or</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-cyan-200 rounded-xl p-4 text-center border-2 border-blue-300 shadow-lg">
                    <div className="text-3xl font-bold text-blue-700">🛒{userStats.purchaseCount}</div>
                    <div className="text-sm text-blue-800 font-semibold">Expéditions</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl p-4 text-center border-2 border-green-300 shadow-lg">
                    <div className="text-3xl font-bold text-green-700">🗓️{userStats.uniquePurchaseMonths}</div>
                    <div className="text-sm text-green-800 font-semibold">Mois en mer</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-100 to-violet-200 rounded-xl p-4 text-center border-2 border-purple-300 shadow-lg">
                    <div className="text-3xl font-bold text-purple-700">🤝{userStats.successfulReferrals}</div>
                    <div className="text-sm text-purple-800 font-semibold">Équipage recruté</div>
                  </div>
                </div>
              </div>

              {/* Progression vers le niveau suivant */}
              {nextLevelProgress && (
                <div className="bg-gradient-to-br from-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 border-2 border-blue-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold flex items-center text-amber-300">
                      <span className="mr-3 text-3xl">🎯</span>
                      Progression vers {LOYALTY_LEVELS[nextLevelProgress.nextLevel].treasureTitle}
                    </h3>
                    <button
                      onClick={() => setShowTips(!showTips)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-all shadow-lg"
                    >
                      💡 {showTips ? "Masquer" : "Conseils"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {nextLevelProgress.conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded-full ${condition.met ? "bg-green-500" : "bg-gray-500"} shadow-lg`}
                          ></div>
                          <span className={`font-medium ${condition.met ? "text-green-300" : "text-gray-300"}`}>
                            {condition.label}
                            {condition.isOr && <span className="text-xs text-orange-400 ml-1">(OU)</span>}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${condition.met ? "text-green-400" : "text-gray-400"}`}>
                            {condition.current} / {condition.required}
                          </span>
                          {condition.met && <span className="text-green-400 ml-2 text-xl">✓</span>}
                        </div>
                      </div>
                    ))}
                    {/* Critère supplémentaire pour le parrainage si c'est le niveau Fidèle */}
                    {nextLevelProgress.nextLevel === "Fidèle" && (
                      <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded-full ${userStats.successfulReferrals >= 1 ? "bg-green-500" : "bg-gray-500"} shadow-lg`}
                          ></div>
                          <span className={`font-medium ${userStats.successfulReferrals >= 1 ? "text-green-300" : "text-gray-300"}`}>
                            Parrainages
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-lg ${userStats.successfulReferrals >= 1 ? "text-green-400" : "text-gray-400"}`}>
                            {userStats.successfulReferrals} / 1
                          </span>
                          {userStats.successfulReferrals >= 1 && <span className="text-green-400 ml-2 text-xl">✓</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  

                  {showTips && (
                    <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <h4 className="text-lg font-bold text-yellow-300 mb-3">🧭 Conseils pour progresser plus vite :</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-semibold text-amber-300 mb-2">Pour les pièces d'or :</h5>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {PROGRESS_TIPS.loyaltyPoints.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-blue-300 mb-2">Pour les achats :</h5>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {PROGRESS_TIPS.purchases.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-purple-300 mb-2">Pour les parrainages :</h5>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {PROGRESS_TIPS.referrals.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "benefits" && (
            <div className="bg-gradient-to-br from-amber-50/95 to-yellow-100/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-4 border-amber-600">
              <h3 className="text-2xl font-bold mb-6 text-amber-900 flex items-center">
                <span className="mr-3 text-3xl">🎁</span>
                Vos avantages actuels - {currentLevelInfo.treasureTitle}
              </h3>
              <div className="bg-gradient-to-r from-amber-100 to-yellow-200 rounded-xl p-6 mb-6 border-2 border-amber-400">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">{currentLevelInfo.treasureIcon}</span>
                  <h4 className="text-2xl font-bold text-amber-900">{currentLevelInfo.treasureTitle}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentLevelInfo.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="bg-white/80 rounded-lg p-4 border-2 border-amber-300 shadow-md hover:shadow-lg transition-all flex items-center"
                    >
                      <span className="text-2xl mr-3 text-amber-600">🎖️</span>
                      <p className="text-amber-800 font-semibold">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
              {nextLevelProgress && (
                <div className="bg-gradient-to-r from-blue-100 to-cyan-200 rounded-xl p-6 border-2 border-blue-300">
                  <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <span className="mr-3 text-2xl">🌟</span>
                    Avantages du prochain niveau - {LOYALTY_LEVELS[nextLevelProgress.nextLevel].treasureTitle}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LOYALTY_LEVELS[nextLevelProgress.nextLevel].benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="bg-white/70 rounded-lg p-4 border-2 border-blue-300 shadow-md opacity-80 hover:opacity-100 transition-all flex items-center"
                      >
                        <span className="text-2xl mr-3 text-blue-600">🔓</span>
                        <p className="text-blue-800 font-semibold">{benefit}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-blue-700 text-sm mt-4">
                    Atteignez {LOYALTY_LEVELS[nextLevelProgress.nextLevel].treasureTitle} pour débloquer ces avantages !
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "ranks" && (
            <div className="bg-gradient-to-br from-amber-50/95 to-yellow-100/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-4 border-amber-600">
              <h3 className="text-2xl font-bold mb-6 text-amber-900 flex items-center">
                <span className="mr-3 text-3xl">🗺️</span>
                Tous les grades de l'équipage
              </h3>
              <div className="space-y-4">
                {Object.entries(LOYALTY_LEVELS).map(([level, info]) => {
                  const status = getLevelStatus(level);

                  return (
                    <div
                      key={level}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-300
                        ${status === "current" ? "border-amber-500 bg-gradient-to-r from-amber-100 to-yellow-200 shadow-xl scale-105" : 
                          status === "completed" ? "border-green-500 bg-green-50" : 
                          "border-amber-300 bg-white/80 backdrop-blur-sm hover:shadow-lg"}
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{info.treasureIcon}</span>
                        <div>
                          <h4 className="font-bold text-lg text-amber-900">{info.treasureTitle}</h4>
                          <p className="text-sm text-amber-700">{info.conditions}</p>
                        </div>
                      </div>
                      {status === "current" && (
                        <div className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">
                          🚢 Grade actuel
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Widget flottant */}
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-4 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all border-2 border-yellow-400">
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-bounce">🚢</span>
              <div className="text-sm">
                <div className="font-bold">{currentLevelInfo.treasureTitle}</div>
                <div className="text-yellow-100">{loyaltyPoints} 💰</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}