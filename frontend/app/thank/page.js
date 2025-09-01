"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const ThankYouPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLastOrder = async () => {
      try {
        // Ajouter un délai de 1 seconde pour laisser le temps à MongoDB
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await fetch("http://192.168.43.57:5000/api/order/last-order", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération de la dernière commande");
        }

        const data = await response.json();
        console.log("Données de la dernière commande:", data);

        setUserId(data.userId);
        setOrderId(data.orderId);
        setLoading(false);
      } catch (err) {
        console.error("Erreur dans fetchLastOrder:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLastOrder();
  }, [router]);

  const handleReturnHome = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200">
          <div className="animate-spin text-6xl mb-4">⚓</div>
          <p className="text-amber-800 text-xl font-semibold">Navigation en cours...</p>
          <p className="text-amber-600">Préparation de votre trésor</p>
        </div>
      </div>
    );
  }

  if (error || !userId || !orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-red-600 text-xl font-semibold mb-4">
            Tempête en vue ! Impossible de charger les données de la commande.
          </p>
          <p className="text-red-500">Redirection vers le port sûr...</p>
          {setTimeout(() => router.push("/order"), 2000)}
        </div>
      </div>
    );
  }

  const qrCodeUrl = `http://192.168.43.57:5000/api/auth/scan?userId=${userId}&orderId=${orderId}`;

  console.log("=== ThankYouPage Logs ===");
  console.log("userId utilisé:", userId);
  console.log("orderId utilisé:", orderId);
  console.log("QR Code URL généré:", qrCodeUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Éléments décoratifs d'arrière-plan */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-8xl">🏴‍☠️</div>
        <div className="absolute top-20 right-20 text-6xl">⚓</div>
        <div className="absolute bottom-20 left-20 text-7xl">🗺️</div>
        <div className="absolute bottom-10 right-10 text-6xl">💰</div>
      </div>

      {/* Nuages décoratifs */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-100/30 to-transparent"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* En-tête avec animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-8xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-amber-800 drop-shadow-lg">
            🎉 Trésor Sécurisé ! 🎉
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg text-amber-700 mb-2">
            <span>⚔️</span>
            <span className="font-semibold">Votre butin a été ajouté au coffre-fort</span>
            <span>⚔️</span>
          </div>
          <p className="text-amber-600 italic">
            "Félicitations, matelot ! Une nouvelle étape vers le grand trésor..."
          </p>
        </div>

        {/* Progress Bar Pirate */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-amber-100 border-2 border-amber-300 rounded-full p-2 shadow-inner">
            <div className="flex items-center justify-between text-sm text-amber-700 mb-1">
              <span>🚢 Votre Position</span>
              <span>Prochain Trésor 💎</span>
            </div>
            <div className="relative bg-amber-200 rounded-full h-4 overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full animate-pulse w-3/5"></div>
              <div className="absolute left-3/5 top-1/2 transform -translate-y-1/2 text-xl">🏴‍☠️</div>
            </div>
            <div className="text-center mt-2 text-amber-700 font-semibold">
              ⭐ Plus que quelques pièces d'or pour débloquer le prochain niveau ! ⭐
            </div>
          </div>
        </div>

        {/* Section QR Code avec thème pirate */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-amber-300 p-8 relative">
            {/* Décorations d'angle */}
            <div className="absolute top-2 left-2 text-2xl">⚓</div>
            <div className="absolute top-2 right-2 text-2xl">⚓</div>
            <div className="absolute bottom-2 left-2 text-2xl">💰</div>
            <div className="absolute bottom-2 right-2 text-2xl">💰</div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center justify-center gap-2">
                <span>🗝️</span>
                <span>Clé du Trésor</span>
                <span>🗝️</span>
              </h2>
              <p className="text-amber-700 mb-6 italic">
                "Scannez cette carte mystérieuse pour révéler vos pièces d'or de fidélité"
              </p>
              
              {/* QR Code avec effet parchemin */}
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-4 rounded-lg border-2 border-amber-400 shadow-lg">
                  <QRCodeSVG 
                    value={qrCodeUrl} 
                    size={200}
                    fgColor="#92400e"
                    bgColor="#fef3c7"
                  />
                </div>
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-lg animate-pulse"></div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span className="font-semibold">Conseil de Pirate :</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Gardez précieusement cette carte ! Elle contient vos coordonnées vers le trésor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de retour thématique */}
        <div className="text-center">
          <button
            onClick={handleReturnHome}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-amber-400"
          >
            <span className="text-2xl group-hover:animate-bounce">🚢</span>
            <span>Retourner au Port</span>
            <span className="text-2xl group-hover:animate-bounce">⚓</span>
            
            {/* Effet de vague au survol */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <p className="text-amber-600 text-sm mt-4 italic">
            "L'aventure continue, matelot ! D'autres trésors vous attendent..."
          </p>
        </div>

        {/* Citation pirate en bas */}
        <div className="text-center mt-12 p-4 bg-amber-100/50 rounded-lg border border-amber-200">
          <p className="text-amber-700 italic text-lg">
            "Un vrai pirate n'abandonne jamais sa quête du trésor ultime !"
          </p>
          <p className="text-amber-600 text-sm mt-2">- Capitaine LoyaltyHub 🏴‍☠️</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;