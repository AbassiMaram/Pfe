"use client";

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaStore, FaTshirt, FaUtensils, FaLaptop, FaGem, FaSearch, FaCompass, FaMapMarkerAlt, FaCoins, FaGift, FaHeart, FaComment, FaShip, FaMap } from "react-icons/fa";

const ShopPage = () => {
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState({});
  const [sentiments, setSentiments] = useState({});
  const [userProgress, setUserProgress] = useState({
    totalCoins: 0,
    nextTreasureAt: 500
  });
  const router = useRouter();

  useEffect(() => {
    console.log("Page Shop chargée !");
    fetchShops();
    // Charger la progression utilisateur depuis localStorage ou API
    const savedCoins = localStorage.getItem("userCoins") || "0";
    setUserProgress(prev => ({ ...prev, totalCoins: parseInt(savedCoins) }));
  }, []);

  const analyzeSentiment = async (comment) => {
    try {
      alert("Envoi au backend pour analyse...");
      const response = await fetch("http://localhost:5001/api/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const result = await response.json();
      if (response.ok) {
        alert("Sentiment reçu : " + result.sentiment);
        return result.sentiment;
      } else {
        alert("Erreur API : " + result.error);
        return "inconnu";
      }
    } catch (error) {
      alert("Erreur réseau : " + error.message);
      return "inconnu";
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/shops/shop");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des boutiques.");
      }
      const data = await response.json();
      console.log("Données des boutiques :", data);
      setStores(data);
      data.forEach((store) => addInteraction(store._id, "visit", null, "Shop"));
    } catch (err) {
      console.error("Erreur :", err.message);
      setError("Impossible de récupérer les boutiques.");
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async (targetId, type, value, targetType, comment = null) => {
    const userId = localStorage.getItem("userId") || "667f5e9b8d4b2c1f3e8b4567";
    try {
      const response = await fetch("http://localhost:5000/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, targetId, targetType, value, comment }),
      });
      const result = await response.json();
      console.log("Réponse API :", response.status, result);
      if (response.status === 200 || response.status === 201) {
        if (type !== "visit") {
          // Ajouter des pièces pour les interactions
          const coinsGained = type === "like" ? 5 : type === "review" ? 10 : 0;
          if (coinsGained > 0) {
            const newTotal = userProgress.totalCoins + coinsGained;
            setUserProgress(prev => ({ ...prev, totalCoins: newTotal }));
            localStorage.setItem("userCoins", newTotal.toString());
          }
          
          if (type === "review" && comment) {
            const sentiment = await analyzeSentiment(comment);
            setSentiments((prev) => ({
              ...prev,
              [targetId]: [...(prev[targetId] || []), sentiment],
            }));
            setComments((prev) => ({ ...prev, [targetId]: "" }));
          }
        }
      } else {
        console.error("Erreur API :", response.status, result);
      }
    } catch (error) {
      console.error("Erreur réseau :", error.message);
    }
  };

  const handleCommentChange = (shopId, value) => {
    setComments((prev) => ({ ...prev, [shopId]: value }));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Mode":
        return <FaTshirt className="mr-2" />;
      case "Restauration":
        return <FaUtensils className="mr-2" />;
      case "Électronique":
        return <FaLaptop className="mr-2" />;
      case "Beauté":
        return <FaGem className="mr-2" />;
      default:
        return <FaStore className="mr-2" />;
    }
  };

  const filteredStores = selectedCategory
    ? stores.filter((store) => store.category === selectedCategory)
    : stores;

  const searchedStores = filteredStores.filter((store) =>
    `${store.name} ${store.description}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const progressPercentage = (userProgress.totalCoins / userProgress.nextTreasureAt) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🏴‍☠️</div>
        <div className="absolute top-20 right-20 text-4xl">⚓</div>
        <div className="absolute bottom-20 left-20 text-5xl">🦜</div>
        <div className="absolute bottom-10 right-10 text-4xl">🗺️</div>
      </div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header avec progression */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-4 flex items-center justify-center">
            <FaMap className="mr-3 text-amber-700" />
            Îles aux Trésors Marchands
            <FaCompass className="ml-3 text-amber-700" />
          </h1>
          
          {/* Widget de progression */}
          <div className="bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg p-4 max-w-md mx-auto mb-6 border-2 border-amber-400 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FaShip className="text-amber-800 mr-2" />
                <span className="font-semibold text-amber-900">Votre Progression</span>
              </div>
              <div className="flex items-center text-amber-800">
                <FaCoins className="mr-1" />
                <span className="font-bold">{userProgress.totalCoins}</span>
              </div>
            </div>
            
            <div className="w-full bg-amber-300 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-amber-800 text-center">
              <FaGift className="inline mr-1" />
              Plus que {userProgress.nextTreasureAt - userProgress.totalCoins} pièces pour le prochain trésor !
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar catégories avec thème pirate */}
          <div className="w-64 bg-gradient-to-b from-amber-100 to-orange-100 p-4 rounded-lg shadow-lg border-2 border-amber-300">
            <h2 className="text-2xl font-semibold mb-4 text-amber-900 flex items-center">
              <FaCompass className="mr-2" />
              Îles à Explorer
            </h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center w-full text-left p-3 rounded-lg text-lg transition-all ${
                    selectedCategory === null 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" 
                      : "hover:bg-amber-200 text-amber-800"
                  }`}
                >
                  <FaMapMarkerAlt className="mr-2" />
                  Toutes les Îles
                </button>
              </li>
              {[...new Set(stores.map((store) => store.category))].map((category) => (
                <li key={category}>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center w-full text-left p-3 rounded-lg text-lg transition-all ${
                      selectedCategory === category 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" 
                        : "hover:bg-amber-200 text-amber-800"
                    }`}
                  >
                    {getCategoryIcon(category)}
                    Île {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <p className="text-center text-amber-800 text-lg mb-6">
              {selectedCategory
                ? `🏝️ Explorez l'Île ${selectedCategory}`
                : "🗺️ Explorez toutes les îles aux trésors"}
            </p>

            {/* Search bar avec thème */}
            <div className="mt-4 flex justify-center mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chercher une île au trésor..."
                  className="w-full p-3 pl-10 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600" />
              </div>
            </div>

            {/* Boutiques avec thème aventure */}
            {loading ? (
              <div className="text-center text-amber-800 text-lg">
                <div className="text-6xl mb-4">⚓</div>
                <p>Navigation vers les îles aux trésors...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 text-lg">
                <div className="text-6xl mb-4">🏴‍☠️</div>
                <p>{error}</p>
              </div>
            ) : searchedStores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {searchedStores.map((store) => {
                  const imageSrc =
                    store.name.toLowerCase() === "zara"
                      ? "/zara.jpeg"
                      : store.imageUrl || "https://via.placeholder.com/300x200?text=Île+Mystérieuse";

                  return (
                    <div
                      key={store._id}
                      className="bg-gradient-to-b from-amber-50 to-orange-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-amber-200 hover:border-amber-400 relative overflow-hidden"
                    >
                      {/* Decoration corner */}
                      <div className="absolute top-2 right-2 text-2xl">🏝️</div>
                      
                      <div className="w-full h-40 mb-4 rounded-lg overflow-hidden border-2 border-amber-300">
                        <img
                          src={imageSrc}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          onError={(e) => console.log(`Erreur de chargement de l'image pour ${store.name}:`, e)}
                        />
                      </div>
                      
                      <h2 className="text-xl font-semibold text-amber-900 mb-2">{store.name}</h2>
                      <p className="text-amber-700 mb-4">{store.description}</p>
                      
                      <button
                        onClick={() => router.push(`/shop/${store._id}`)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-semibold shadow-md mb-4"
                      >
                        🗺️ Explorer cette Île
                      </button>
                      
                      {/* Actions avec thème */}
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => addInteraction(store._id, "like", 1, "Shop")}
                          className="flex items-center justify-center text-red-500 hover:text-red-700 transition-colors font-semibold"
                        >
                          <FaHeart className="mr-2" />
                          Ajouter aux Favoris (+5 pièces)
                        </button>
                        
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={comments[store._id] || ""}
                            onChange={(e) => handleCommentChange(store._id, e.target.value)}
                            placeholder="Partagez votre aventure sur cette île..."
                            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                            rows="2"
                          />
                          <button
                            onClick={() => {
                              if (comments[store._id]) {
                                addInteraction(store._id, "review", null, "Shop", comments[store._id]);
                              }
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:bg-gray-400 font-semibold"
                            disabled={!comments[store._id]}
                          >
                            <FaComment className="inline mr-2" />
                            Partager (+10 pièces)
                          </button>
                          
                          {sentiments[store._id] && (
                            <div className="bg-amber-100 p-2 rounded-lg border border-amber-300">
                              <p className="text-sm">
                                <span className="font-semibold">Sentiment de l'aventure :</span>{" "}
                                <span
                                  className={
                                    sentiments[store._id][sentiments[store._id].length - 1] === "positif"
                                      ? "text-green-600 font-bold"
                                      : sentiments[store._id][sentiments[store._id].length - 1] === "négatif"
                                      ? "text-red-600 font-bold"
                                      : "text-yellow-600 font-bold"
                                  }
                                >
                                  {sentiments[store._id][sentiments[store._id].length - 1] === "positif" ? "⭐ Positif" :
                                   sentiments[store._id][sentiments[store._id].length - 1] === "négatif" ? "⚠️ Négatif" : "😐 Neutre"}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-amber-800 text-lg">
                <div className="text-6xl mb-4">🏝️</div>
                <p>Aucune île découverte pour cette recherche</p>
                <p className="text-sm mt-2">Ajustez votre boussole et réessayez !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;