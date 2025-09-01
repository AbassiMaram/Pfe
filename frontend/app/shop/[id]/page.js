"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaShoppingCart, FaHeart, FaCoins, FaGem, FaCompass, FaMap, FaShip, FaSkull, FaAnchor, FaStar, FaComment, FaEye } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const ShopDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [comments, setComments] = useState({});
  const [sentiments, setSentiments] = useState({});
  const [bestSellerId, setBestSellerId] = useState(null);
  const [userProgress, setUserProgress] = useState({
    totalCoins: 0,
    nextTreasureAt: 500
  });

  useEffect(() => {
    console.log("🏴‍☠️ Navigation vers l'île aux trésors !");
    console.log("🗺️ ID de l'île :", id);
    const userId = localStorage.getItem("userId");
    console.log("👤 ID du pirate :", userId);
    
    // Charger les pièces du pirate
    const savedCoins = localStorage.getItem("userCoins") || "0";
    setUserProgress(prev => ({ ...prev, totalCoins: parseInt(savedCoins) }));
    
    if (!userId) {
      setCartMessage("🏴‍☠️ Rejoignez l'équipage pour explorer cette île !");
      setTimeout(() => setCartMessage(""), 3000);
      router.push("/register");
      return;
    }
    if (id) {
      fetchProducts();
      fetchBestSeller();
      addInteraction(id, "visit", null, "Shop");
    }
  }, [id, router]);

  const fetchBestSeller = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/best-seller?shopId=${id}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération du trésor le plus convoité.");
      const data = await response.json();
      console.log("💎 Trésor le plus convoité :", data.productId);
      setBestSellerId(data.productId);
    } catch (err) {
      console.error("⚠️ Erreur lors de la recherche du trésor principal :", err.message);
    }
  };

  const analyzeSentiment = async (comment) => {
    try {
      console.log("🔍 Analyse du message de l'aventurier...");
      console.log("Commentaire envoyé pour analyse :", comment);
      const response = await fetch("http://localhost:5001/api/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      console.log("Statut de la réponse API de sentiment :", response.status);
      const result = await response.json();
      console.log("Réponse API complète /api/analyze-sentiment :", result);
      if (response.ok) {
        console.log("✨ Sentiment décodé :", result.sentiment);
        alert("🔮 Vision révélée : " + result.sentiment);
        return result.sentiment;
      } else {
        console.error("❌ Erreur de décodage :", result.error);
        alert("⚠️ Erreur de la boule de cristal : " + result.error);
        return "inconnu";
      }
    } catch (error) {
      console.error("🌊 Tempête dans les communications :", error.message);
      alert("🌊 Tempête dans les communications : " + error.message);
      return "inconnu";
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/by-shop?shopId=${id}`);
      if (!response.ok) throw new Error("Erreur lors de l'exploration des trésors.");
      const data = await response.json();
      console.log("💰 Trésors découverts :", data);
      setProducts(data);
    } catch (err) {
      console.error("⚠️ Erreur :", err.message);
      setError("🏴‍☠️ Impossible d'explorer cette île aux trésors.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId) => {
    const storedCart = localStorage.getItem("cart");
    let cart = storedCart ? JSON.parse(storedCart) : [];
    const existingProduct = cart.find((item) => item._id === productId);

    if (existingProduct) {
      cart = cart.map((item) =>
        item._id === productId ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      );
    } else {
      const product = products.find((prod) => prod._id === productId);
      if (product) cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartItems(cart);
    setCartMessage("⚓ Trésor ajouté à votre coffre !");
    setTimeout(() => setCartMessage(""), 3000);
    
    // Ajouter des pièces pour l'achat
    const coinsGained = 3;
    const newTotal = userProgress.totalCoins + coinsGained;
    setUserProgress(prev => ({ ...prev, totalCoins: newTotal }));
    localStorage.setItem("userCoins", newTotal.toString());
  };

  const handleViewCart = () => {
    router.push("/cart");
  };

  const handleCommentChange = (productId, value) => {
    setComments((prev) => ({ ...prev, [productId]: value }));
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  const addInteraction = async (targetId, type, value, targetType, comment = null) => {
    const userId = localStorage.getItem("userId");
    console.log("userId dans addInteraction :", userId);
    if (!userId) {
      console.error("🚫 Aucun pirate identifié. Rejoignez l'équipage !");
      setCartMessage("🏴‍☠️ Rejoignez l'équipage pour interagir !");
      setTimeout(() => setCartMessage(""), 3000);
      router.push("/register");
      return;
    }

    try {
      console.log("Début de l'envoi de l'interaction...");
      console.log("Données envoyées :", { userId, type, targetId, targetType, value, comment });
      const response = await fetch("http://localhost:5000/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, targetId, targetType, value, comment }),
      });
      console.log("Statut de la réponse API :", response.status);
      const result = await response.json();
      console.log("Réponse API complète /api/interactions :", result);
      
      if (response.status === 200 || response.status === 201) {
        console.log("Interaction enregistrée avec succès !");
        
        // Récompenses pirates
        const coinsGained = type === "like" ? 5 : type === "review" ? 10 : 0;
        if (coinsGained > 0) {
          const newTotal = userProgress.totalCoins + coinsGained;
          setUserProgress(prev => ({ ...prev, totalCoins: newTotal }));
          localStorage.setItem("userCoins", newTotal.toString());
        }
        
        const messages = {
          like: "❤️ Trésor ajouté aux favoris ! (+5 pièces d'or)",
          review: "📝 Message envoyé dans une bouteille ! (+10 pièces d'or)",
          visit: "👁️ Île explorée !"
        };
        
        setCartMessage(messages[type] || "✨ Action accomplie !");
        setTimeout(() => setCartMessage(""), 3000);
        
        if (type === "review" && comment) {
          console.log("Début de l'analyse de sentiment pour le commentaire :", comment);
          const sentiment = await analyzeSentiment(comment);
          console.log("Sentiment calculé :", sentiment);
          setSentiments((prev) => ({ ...prev, [targetId]: sentiment }));
          setComments((prev) => ({ ...prev, [targetId]: "" }));
        }
      } else {
        console.error("❌ Erreur API :", response.status, result);
        setCartMessage("⚠️ Erreur lors de l'action : " + result.message);
        setTimeout(() => setCartMessage(""), 3000);
      }
    } catch (error) {
      console.error("🌊 Tempête dans les communications :", error.message);
      setCartMessage("🌊 Tempête dans les communications : " + error.message);
      setTimeout(() => setCartMessage(""), 3000);
    }
  };

  const progressPercentage = (userProgress.totalCoins / userProgress.nextTreasureAt) * 100;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Sidebar Navigation avec thème pirate */}
      <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6 flex-shrink-0 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-4xl">⚓</div>
          <div className="absolute bottom-4 left-4 text-3xl">🦜</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">🏴‍☠️</div>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaCompass className="mr-2 text-amber-400" />
            Navigation
          </h2>
          
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => handleNavigation(`/about/${id}`)}
                className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center"
              >
                <FaMap className="mr-3 text-amber-400" />
                Histoire de l'Île
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation(`/shop/${id}`)}
                className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center bg-gray-700"
              >
                <FaGem className="mr-3 text-amber-400" />
                Coffres aux Trésors
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation(`/contact/${id}`)}
                className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center"
              >
                <FaShip className="mr-3 text-amber-400" />
                Contacter l'Équipage
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 text-8xl">🗺️</div>
          <div className="absolute bottom-20 left-20 text-6xl">💎</div>
          <div className="absolute top-1/3 left-10 text-4xl">⚓</div>
        </div>
        
        <div className="container mx-auto relative z-10">
          {/* Header avec progression */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-amber-900 flex items-center">
                <FaGem className="mr-3 text-amber-700" />
                Coffres aux Trésors de l'Île
              </h1>
              <p className="text-amber-700 mt-2">Découvrez les merveilles cachées de cette île mystérieuse</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Widget progression */}
              <div className="bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg p-3 border-2 border-amber-400 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FaCoins className="text-amber-800" />
                  <span className="font-bold text-amber-900">{userProgress.totalCoins}</span>
                </div>
                <div className="w-20 bg-amber-300 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Coffre au trésor (panier) */}
              <button
                onClick={handleViewCart}
                className="flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg"
              >
                <FaGem className="text-xl mr-2" />
                <span className="font-bold">{cartItems.length}</span>
              </button>
            </div>
          </div>

          {cartMessage && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg p-4 mb-6 flex items-center">
              <FaGem className="text-green-600 mr-3 text-xl" />
              <p className="text-green-800 font-semibold">{cartMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4 animate-spin">⚓</div>
              <p className="text-2xl text-amber-800 font-semibold">Navigation vers les trésors...</p>
              <p className="text-amber-600 mt-2">Les pirates explorent l'île...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4">💀</div>
              <p className="text-2xl text-red-600 font-semibold">{error}</p>
              <p className="text-red-500 mt-2">L'île semble déserte...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product._id} className="bg-gradient-to-b from-amber-50 to-orange-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-amber-200 hover:border-amber-400 relative overflow-hidden">
                  {/* Badge Best Seller */}
                  {bestSellerId === product._id && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 flex items-center">
                      <FaSkull className="mr-1" />
                      Trésor Légendaire
                    </div>
                  )}
                  
                  {/* Decoration */}
                  <div className="absolute top-2 left-2 text-2xl opacity-30">💎</div>
                  
                  {/* Image du produit */}
                  {product.imageUrl ? (
                    <div className="mb-4">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-cover rounded-md mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-200 h-48 w-48 flex items-center justify-center rounded-md" style={{ height: "200px", width: "200px" }}>
                      <p className="text-gray-500 text-center">Aucune image disponible</p>
                    </div>
                  )}
{/* Infos produit */}
                  <h2 className="text-xl font-bold text-amber-900 mb-2">{product.name}</h2>
                  <div className="flex items-center mb-3">
                    <FaCoins className="text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-amber-800">{product.price} pièces d'or</span>
                  </div>
                  <p className="text-amber-700 mb-4">{product.description || "Un trésor aux propriétés mystérieuses..."}</p>
                  
                  {/* Actions principales */}
                  <div className="space-y-3">
                    <button
                      onClick={() => addToCart(product._id)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-semibold flex items-center justify-center"
                    >
                      <FaAnchor className="mr-2" />
                      Capturer le Trésor
                    </button>
                    
                    {/* Actions secondaires */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addInteraction(product._id, "like", 1, "Product")}
                        className="flex-1 bg-gradient-to-r from-pink-400 to-red-400 text-white px-3 py-2 rounded-lg hover:from-pink-500 hover:to-red-500 transition-all duration-300 flex items-center justify-center"
                      >
                        <FaHeart className="mr-1 text-sm" />
                        <span className="text-sm">Favoris</span>
                      </button>
                      
                      <select
                        onChange={(e) =>
                          addInteraction(product._id, "review", e.target.value, "Product", comments[product._id])
                        }
                        className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-lg p-2 text-blue-800 font-semibold"
                      >
                        <option value="">⭐ Noter</option>
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <option key={stars} value={stars}>{"⭐".repeat(stars)} ({stars})</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Section commentaires */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <textarea
                        value={comments[product._id] || ""}
                        onChange={(e) => handleCommentChange(product._id, e.target.value)}
                        placeholder="📜 Partagez votre aventure avec ce trésor..."
                        className="w-full p-2 border-2 border-blue-200 rounded-lg bg-white focus:border-blue-400 focus:outline-none"
                        rows="2"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => {
                            if (comments[product._id]) {
                              addInteraction(product._id, "review", null, "Product", comments[product._id]);
                            }
                          }}
                          className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-3 py-1 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          disabled={!comments[product._id]}
                        >
                          <FaComment className="mr-1 text-sm" />
                          Envoyer la Bouteille
                        </button>
                        
                        {sentiments[product._id] && (
                          <div className="flex items-center">
                            <span className="text-sm mr-2">🔮 Vision :</span>
                            <span
                              className={`text-sm font-semibold ${
                                sentiments[product._id] === "positif"
                                  ? "text-green-600"
                                  : sentiments[product._id] === "négatif"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {sentiments[product._id] === "positif" ? "✨ Positive" : 
                               sentiments[product._id] === "négatif" ? "⚡ Négative" : "🌊 Neutre"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bouton détails */}
                    <Link href={`/produit/${product._id}`}>
                      <button className="w-full bg-gradient-to-r from-gray-600 to-slate-600 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-slate-700 transition-all duration-300 flex items-center justify-center">
                        <FaEye className="mr-2" />
                        Explorer en Détail
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-8xl mb-4">🏝️</div>
              <p className="text-2xl text-amber-800 font-semibold">Cette île aux trésors est encore vierge</p>
              <p className="text-amber-600 mt-2">Aucun trésor n'a encore été découvert sur cette terre mystérieuse...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default ShopDetail;       