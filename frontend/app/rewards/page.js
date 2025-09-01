"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const RewardsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const orderId = searchParams.get("orderId");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCoinsAnimation, setShowCoinsAnimation] = useState(false);
  const [pointsAdded, setPointsAdded] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("Initié");

  const calculateLevel = (points) => {
    if (points >= 50000) return "Légende";
    if (points >= 15000) return "Expert";
    if (points >= 5000) return "Aventurier";
    if (points >= 1000) return "Explorateur";
    return "Initié";
  };

 const fetchLoyaltyPoints = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentification requise");

    // Récupération des points
    const pointsResponse = await fetch(`http://192.168.43.57:5000/api/loyalty/points/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!pointsResponse.ok) throw new Error("Erreur points");

    const pointsData = await pointsResponse.json();
    setLoyaltyPoints(pointsData.points);
    
    // Traitement du scan si orderId existe
    if (orderId && !pointsAdded) {
      const scanResponse = await fetch("http://192.168.43.57:5000/api/loyalty/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, orderId })
      });

      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        setPointsAdded(scanData.pointsAdded);
        setShowCoinsAnimation(true);
        setTimeout(() => setShowCoinsAnimation(false), 3000);
      }
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (userId) fetchLoyaltyPoints();
  }, [userId, orderId]);

  const handleConvertRewards = () => {
    router.push(`/ConvertRewards?userId=${userId}&orderId=${orderId || ""}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 border-r-4 border-transparent"></div>
        <p className="mt-4 text-lg text-amber-800">Chargement de vos points...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 max-w-md">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={fetchLoyaltyPoints}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-6">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Vos Récompenses</h1>
        <p className="text-amber-700">Niveau actuel : {currentLevel}</p>
      </div>

      {/* Animation et affichage des points */}
      <div className="flex flex-col items-center mb-10">
        {/* Coffre avec animation */}
        <div className="relative mb-6">
          <Image
            src="/coffre.png"
            alt="Coffre au trésor"
            width={200}
            height={200}
            className="mx-auto drop-shadow-lg"
            priority
          />
          
          {/* Animation des pièces */}
          {showCoinsAnimation && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute animate-coin-fall"
                  style={{
                    left: `${10 + (i * 6)}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1 + Math.random() * 0.5}s`
                  }}
                >
                  <div className="text-2xl text-amber-400">🪙</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points de fidélité */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full max-w-md border border-amber-200">
          <div className="text-center">
            <p className="text-amber-800 text-lg mb-1">Vos points de fidélité</p>
            <p className="text-4xl font-bold text-amber-600">
              {loyaltyPoints.toLocaleString()}
              {pointsAdded > 0 && (
                <span className="ml-2 text-green-500 text-xl animate-bounce">
                  +{pointsAdded}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full max-w-md mb-8">
          <div className="h-4 bg-amber-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
              style={{ width: `${Math.min(100, (loyaltyPoints % 1000) / 10)}%` }}
            ></div>
          </div>
          <p className="text-center text-amber-700 mt-2">
            Prochain niveau: {1000 - (loyaltyPoints % 1000)} points
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col space-y-4 w-full max-w-md">
          <button
            onClick={handleConvertRewards}
            disabled={loyaltyPoints <= 0}
            className={`py-3 px-6 rounded-xl font-bold text-white transition-all ${
              loyaltyPoints > 0 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-amber-200"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Convertir en récompenses
          </button>

          <button
            onClick={() => router.push("/")}
            className="py-3 px-6 rounded-xl font-bold text-amber-700 bg-white border border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes coin-fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-coin-fall {
          animation: coin-fall 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RewardsPage;