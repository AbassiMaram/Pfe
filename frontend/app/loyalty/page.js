"use client";
import { useState, useEffect } from "react";

const LoyaltyPage = () => {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animateCoins, setAnimateCoins] = useState(false);
  const [showTreasureGlow, setShowTreasureGlow] = useState(false);

  const fetchLoyaltyPoints = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Veuillez vous connecter pour voir vos points de fidélité !");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/loyalty", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des points de fidélité");
      }

      const data = await response.json();
      setLoyaltyPoints(data.loyaltyPoints || 0);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des points de fidélité :", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyPoints();

    // Rafraîchissement toutes les 10 secondes
    const interval = setInterval(() => {
      fetchLoyaltyPoints();
    }, 10000); // 10 secondes

    // Animations
    setAnimateCoins(true);
    setShowTreasureGlow(true);
    const timer1 = setTimeout(() => setAnimateCoins(false), 3000);
    const timer2 = setInterval(() => {
      setShowTreasureGlow(prev => !prev);
    }, 4000);

    // Nettoyage de l'intervalle quand le composant est démonté
    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearInterval(timer2);
    };
  }, []);

  const calculateLevel = (points) => {
    if (points < 1000) return { level: 1, nextTarget: 1000, progress: points / 1000, levelName: "Moussaillon" };
    if (points < 5000) return { level: 2, nextTarget: 5000, progress: points / 5000, levelName: "Matelot" };
    if (points < 15000) return { level: 3, nextTarget: 15000, progress: points / 15000, levelName: "Capitaine" };
    if (points < 50000) return { level: 4, nextTarget: 50000, progress: points / 50000, levelName: "Corsaire" };
    return { level: 5, nextTarget: "TRÉSOR ULTIME", progress: 1, levelName: "Légende" };
  };

  const { level, nextTarget, progress, levelName } = calculateLevel(loyaltyPoints);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900">
        <div className="text-center p-8">
          <div className="text-6xl mb-4 animate-spin">⚓</div>
          <div className="text-yellow-300 text-xl animate-pulse">
            Navigation vers votre trésor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br  bg-blue-950 to-indigo-600 overflow-hidden">
      {/* Étoiles scintillantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-200 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${Math.random() * 8 + 4}px`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Pièces d'or flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute text-yellow-400 text-3xl ${animateCoins ? 'animate-bounce' : 'animate-pulse'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            🪙
          </div>
        ))}
      </div>

      <div className="container mx-auto p-6 relative z-10 min-h-screen flex flex-col">
        {/* Header avec titre principal */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-6xl animate-bounce">🏴‍☠️</div>
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 drop-shadow-2xl">
              VOTRE TRÉSOR
            </h1>
            <div className="text-6xl animate-bounce" style={{ animationDelay: "0.5s" }}>🏴‍☠️</div>
          </div>
          <p className="text-xl text-yellow-100 drop-shadow-lg">
            🗺️ Découvrez votre fortune de {levelName} ! 🗺️
          </p>
        </div>

        {/* Zone principale avec coffre et informations */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl w-full">
            
            {/* Coffre au trésor - Zone visuelle */}
            <div className="relative">
              <div className="relative group">
                {/* Effet de lueur autour du coffre */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/30 to-orange-600/30 blur-xl scale-150 transition-opacity duration-2000 ${showTreasureGlow ? 'opacity-100' : 'opacity-50'}`}></div>
                
                {/* Coffre principal - TAILLE DOUBLÉE */}
                <div className="relative z-10 text-center">
                  <img 
                    src="/cof1.png" 
                    alt="Coffre au trésor"
                    className="w-128 h-128 md:w-160 md:h-160 mx-auto mb-4 filter drop-shadow-2xl animate-pulse object-contain"
                    style={{ width: '32rem', height: '32rem' }}
                  />
                  
                  {/* Pièces qui tombent VERTICALEMENT dans le coffre */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-20">
                    <div className="relative">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute text-yellow-400 text-4xl"
                          style={{
                            left: `${-40 + (i % 4) * 20}px`,
                            top: `${Math.floor(i / 4) * -60}px`,
                            animation: `fall-${i} 4s infinite linear`,
                            animationDelay: `${i * 0.5}s`
                          }}
                        >
                          🪙
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations sur les points */}
            <div className="space-y-6">
              {/* Compteur principal de pièces */}
              <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 backdrop-blur-lg p-8 rounded-3xl border-2 border-yellow-500/50 shadow-2xl">
                <div className="text-center">
                  <div className="text-yellow-400 text-2xl font-semibold mb-2 tracking-wider">
                    💰 FORTUNE ACCUMULÉE 💰
                  </div>
                  <div className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-3 drop-shadow-lg">
                    {loyaltyPoints.toLocaleString()}
                  </div>
                  <div className="text-yellow-200 text-xl font-semibold flex items-center justify-center gap-2">
                    <span>🪙</span>
                    PIÈCES D'OR
                    <span>🪙</span>
                  </div>
                </div>
              </div>

              

              {/* Carte d'expédition */}
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 backdrop-blur-lg p-5 rounded-2xl border border-amber-500/30">
                <div className="text-center text-amber-300 mb-3 font-bold">
                  🗺️ VOTRE EXPÉDITION
                </div>
                <div className="flex items-center justify-center gap-1 text-2xl mb-2">
                  {level >= 1 ? "🏝️" : "⚫"} 
                  <span className="text-amber-400">➤</span>
                  {level >= 2 ? "🏝️" : "⚫"}
                  <span className="text-amber-400">➤</span>
                  {level >= 3 ? "🏝️" : "⚫"}
                  <span className="text-amber-400">➤</span>
                  {level >= 4 ? "🏝️" : "⚫"}
                  <span className="text-amber-400">➤</span>
                  {level >= 5 ? "💎" : "⚫"}
                </div>
                <p className="text-amber-100 text-xs text-center italic">
                  "Chaque achat vous rapproche du trésor ultime"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'action */}
        <div className="text-center pb-8">
          <button className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto">
            <span className="text-2xl">⚡</span>
            Continuez votre quête pour plus de trésors !
            <span className="text-2xl">⚡</span>
          </button>
        </div>
      </div>

      {/* Animations CSS personnalisées pour la chute des pièces */}
      <style jsx>{`
        @keyframes fall-0 {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        @keyframes fall-1 {
          0% { transform: translateY(-120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(420px); opacity: 0; }
        }
        @keyframes fall-2 {
          0% { transform: translateY(-90px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(380px); opacity: 0; }
        }
        @keyframes fall-3 {
          0% { transform: translateY(-110px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(410px); opacity: 0; }
        }
        @keyframes fall-4 {
          0% { transform: translateY(-130px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(430px); opacity: 0; }
        }
        @keyframes fall-5 {
          0% { transform: translateY(-140px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(440px); opacity: 0; }
        }
        @keyframes fall-6 {
          0% { transform: translateY(-80px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(370px); opacity: 0; }
        }
        @keyframes fall-7 {
          0% { transform: translateY(-150px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(450px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoyaltyPage;