"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

const ConvertRewardsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const orderId = searchParams.get("orderId");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null); // État pour la notification

  useEffect(() => {
    const fetchLoyaltyPoints = async () => {
      if (!userId) {
        setError("Aucun utilisateur spécifié.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://192.168.43.57:5000/api/rewards?userId=${userId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors de la récupération des points");
        }

        const data = await response.json();
        console.log("Réponse API /api/rewards dans ConvertRewardsPage:", data);
        setLoyaltyPoints(data.points || 0);
        setLoading(false);
      } catch (error) {
        console.error("Erreur fetch:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchLoyaltyPoints();
  }, [userId]);

  const showNotification = (message) => {
    setNotification(message);
    // Faire disparaître la notification après 3 secondes
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleConvert = async (pointsRequired, rewardType) => {
    if (loyaltyPoints < pointsRequired) {
      showNotification("Pas assez de points pour cette récompense !");
      return;
    }

    try {
      const response = await fetch("http://192.168.43.57:5000/api/rewards/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pointsRequired, rewardType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la conversion");
      }

      const data = await response.json();
      setLoyaltyPoints(data.points);
      showNotification(data.message); // Remplacer l'alert par une notification
    } catch (error) {
      console.error("Erreur dans handleConvert:", error);
      showNotification("Erreur : " + error.message); // Remplacer l'alert par une notification
    }
  };

  const handleBackToRewards = () => {
    router.push(`/rewards?userId=${userId}&orderId=${orderId || ""}`);
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin inline-block">
          <svg
            className="w-12 h-12 text-yellow-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#FFD700" />
            <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
              $
            </text>
          </svg>
        </div>
        <p className="mt-4 text-gray-700">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">Erreur : {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 text-center bg-parchment min-h-screen relative">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center bg-yellow-100 border-2 border-yellow-600 rounded-lg p-4 shadow-lg">
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="#FFD700" />
              <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                $
              </text>
            </svg>
            <p className="text-yellow-800 font-semibold">{notification}</p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-4 text-yellow-800">Convertir Vos Points en Récompenses</h1>
      <p className="text-lg text-gray-700 mb-6 flex items-center justify-center">
        Vous avez{" "}
        <span className="font-bold text-yellow-600 mx-2 flex items-center">
          {loyaltyPoints}
          <svg
            className="w-6 h-6 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#FFD700" />
            <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
              $
            </text>
          </svg>
        </span>{" "}
        points de fidélité disponibles.
      </p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-yellow-800">Échange Contre des Cadeaux</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Produit "Mystère" Gratuit</p>
            <p className="text-gray-600 flex items-center justify-center">
              2000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(2000, "Produit Mystère")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Convertir
            </button>
          </div>
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Bon d’achat de 5dt</p>
            <p className="text-gray-600 flex items-center justify-center">
              1000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(1000, "Bon d’achat 5€")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Convertir
            </button>
          </div>
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Produit Électronique Gratuit</p>
            <p className="text-gray-600 flex items-center justify-center">
              5000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(5000, "Produit Électronique")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Convertir
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-yellow-800">Statut VIP & Avantages Premium</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Bronze (5% réduction)</p>
            <p className="text-gray-600 flex items-center justify-center">
              1000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(1000, "Statut Bronze")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Débloquer
            </button>
          </div>
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Argent (Livraison gratuite + 10%)</p>
            <p className="text-gray-600 flex items-center justify-center">
              5000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(5000, "Statut Argent")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Débloquer
            </button>
          </div>
          <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-800">Or (Accès prioritaire)</p>
            <p className="text-gray-600 flex items-center justify-center">
              10000
              <svg
                className="w-5 h-5 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#FFF" fontWeight="bold">
                  $
                </text>
              </svg>
            </p>
            <button
              onClick={() => handleConvert(10000, "Statut Or")}
              className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
            >
              Débloquer
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-yellow-800">Transformer en Dons</h2>
        <div className="p-4 border-4 border-yellow-600 rounded-lg bg-white shadow-lg">
          <p className="text-lg font-semibold text-gray-800">1000 points = 5dt pour  CRT</p>
          <p className="text-gray-600">Croissant Rouge Tunisien</p>
          <button
            onClick={() => handleConvert(1000, "Don 5€")}
            className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg border-2 border-yellow-800 hover:bg-yellow-700 transition-colors"
          >
            Faire un don
          </button>
        </div>
      </div>

      <button
        onClick={handleBackToRewards}
        className="bg-gray-600 text-white px-6 py-2 rounded-lg border-2 border-gray-800 hover:bg-gray-700 transition-colors"
      >
        Retour aux points de fidélité
      </button>
    </div>
  );
};

export default ConvertRewardsPage;