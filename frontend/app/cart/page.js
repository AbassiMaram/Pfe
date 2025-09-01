// C:/Users/lenovo/Desktop/pfe/frontend/app/cart/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaTrashAlt } from "react-icons/fa";
import dynamic from "next/dynamic";
const Chatbot = dynamic(() => import("../../components/Chatbot"), { ssr: false });

const CartPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://192.168.43.57:5000/api/merchant/products/${user.merchantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
    }
  };

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      console.log("Token envoyé:", token);
      console.log("UserId envoyé:", userId);
      console.log("URL de la requête:", `http://localhost:5000/api/cart?userId=${userId}`);

      try {
        let items = [];

        if (token && userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
          const response = await fetch(`http://localhost:5000/api/cart?userId=${userId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          console.log("Statut de la réponse:", response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Erreur serveur:", response.status, errorData);
            throw new Error(`Erreur ${response.status}: ${errorData.message || "Inconnue"}`);
          }

          const data = await response.json();
          console.log("Données brutes reçues:", data);

          const itemsArray = data.cart?.items || data.items || [];
          console.log("Items extraits:", itemsArray);

          if (Array.isArray(itemsArray) && itemsArray.length > 0) {
            const validItems = itemsArray.filter((item) => item.productId && item.productId._id);
            items = await Promise.all(
              validItems.map(async (item) => {
                const productId = item.productId._id;
                try {
                  const stockResponse = await fetch(`http://localhost:5000/api/products/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!stockResponse.ok) {
                    console.warn(`Produit ${productId} non trouvé ou erreur`);
                    return {
                      _id: productId,
                      name: item.productId.name || "Produit inconnu",
                      price: Number(item.productId.price) || 0,
                      category: item.productId.category || "Inconnu",
                      quantity: Number(item.quantity) || 1,
                    };
                  }
                  const stockData = await stockResponse.json();
                  if (stockData.stock === 0) {
                    setMessage(`⚔️ Trésor épuisé : ${stockData.name} a été retiré de votre coffre.`);
                    return null;
                  }
                  return {
                    _id: productId,
                    name: item.productId.name || "Produit inconnu",
                    price: Number(item.productId.price) || 0,
                    category: item.productId.category || "Inconnu",
                    quantity: Number(item.quantity) || 1,
                  };
                } catch (error) {
                  console.error(`Erreur pour produit ${productId}:`, error.message);
                  return {
                    _id: productId,
                    name: item.productId.name || "Produit inconnu",
                    price: Number(item.productId.price) || 0,
                    category: item.productId.category || "Inconnu",
                    quantity: Number(item.quantity) || 1,
                  };
                }
              })
            );
            items = items.filter((item) => item !== null);
            console.log("Items mappés:", items);
          }
        }

        if (items.length === 0) {
          const storedCart = localStorage.getItem("cart");
          if (storedCart) {
            console.log("Données locales:", storedCart);
            items = JSON.parse(storedCart);
            items = await Promise.all(
              items.map(async (item) => {
                try {
                  const stockResponse = await fetch(`http://localhost:5000/api/products/${item._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!stockResponse.ok) return item;
                  const stockData = await stockResponse.json();
                  if (stockData.stock === 0) {
                    setMessage(`⚔️ Trésor épuisé : ${stockData.name} a été retiré de votre coffre.`);
                    return null;
                  }
                  return item;
                } catch (error) {
                  console.error(`Erreur pour produit ${item._id}:`, error.message);
                  return item;
                }
              })
            );
            items = items.filter((item) => item !== null);
          } else {
            console.warn("Aucun item valide, panier vide");
            items = [];
          }
        }

        setCartItems(items);
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (error) {
        console.error("Erreur:", error.message);
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          console.log("Données locales:", storedCart);
          setCartItems(JSON.parse(storedCart));
        } else {
          console.warn("Aucune donnée locale, panier vide");
          setCartItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      try {
        const response = await fetch(`http://localhost:5000/api/cart/remove`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId }),
        });

        if (!response.ok) throw new Error("Erreur lors de la suppression côté serveur");
      } catch (error) {
        console.error("Erreur suppression:", error.message);
      }
    }

    const updatedCart = cartItems.filter((item) => item._id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    console.log("Produit supprimé:", productId);
    setMessage("🏴‍☠️ Produit retiré de votre coffre au trésor !");
  };

  const updateQuantity = async (productId, quantity) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const newQuantity = Math.max(1, quantity);

    try {
      const stockResponse = await fetch(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stockResponse.ok) throw new Error("Erreur lors de la vérification du stock");
      const stockData = await stockResponse.json();

      if (stockData.stock === 0) {
        setMessage(`⚔️ Trésor épuisé : ${stockData.name} a été retiré de votre coffre.`);
        removeFromCart(productId);
        return;
      }
      if (stockData.stock < newQuantity) {
        setMessage(`🗺️ Stock insuffisant pour ${stockData.name}. Quantité maximale disponible : ${stockData.stock}.`);
        const adjustedQuantity = stockData.stock;
        const updatedCart = cartItems.map((item) =>
          item._id === productId ? { ...item, quantity: adjustedQuantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));

        if (token && userId) {
          await fetch(`http://localhost:5000/api/cart/update`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, productId, quantity: adjustedQuantity }),
          });
        }
        return;
      }
    } catch (error) {
      console.error("Erreur vérification stock:", error.message);
    }

    if (token && userId) {
      try {
        const response = await fetch(`http://localhost:5000/api/cart/update`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId, quantity: newQuantity }),
        });

        if (!response.ok) throw new Error("Erreur lors de la mise à jour côté serveur");
      } catch (error) {
        console.error("Erreur mise à jour:", error.message);
      }
    }

    const updatedCart = cartItems.map((item) =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    console.log("Quantité mise à jour:", { productId, quantity: newQuantity });
    setMessage(`💰 Quantité mise à jour dans votre coffre pour ${updatedCart.find((item) => item._id === productId).name}.`);
  };

  const confirmOrder = async () => {
    if (cartItems.length === 0) {
      setMessage("🏴‍☠️ Votre coffre au trésor est vide, moussaillon !");
      return;
    }

    const token = localStorage.getItem("token");
    for (const item of cartItems) {
      try {
        const stockResponse = await fetch(`http://localhost:5000/api/products/${item._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!stockResponse.ok) {
          console.warn(`Produit ${item._id} non trouvé ou erreur`);
          continue;
        }
        const stockData = await stockResponse.json();
        if (stockData.stock < item.quantity) {
          setMessage(`⚔️ Impossible de finaliser l'expédition ! Stock insuffisant pour ${stockData.name} (Disponible : ${stockData.stock}, Demandé : ${item.quantity}).`);
          return;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du stock:", error.message);
        setMessage("🗺️ Erreur lors de la vérification des trésors disponibles.");
        return;
      }
    }

    const mappedItems = cartItems.map((item) => ({
      productId: item._id,
      quantity: item.quantity || 1,
      price: item.price || 0,
      category: item.category || "Unknown",
    }));

    const totalAmount = mappedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    localStorage.setItem("pendingOrder", JSON.stringify({
      items: mappedItems,
      totalAmount,
    }));

    console.log("Commande préparée:", { items: mappedItems, totalAmount });
    router.push("/order");
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Fonction pour obtenir l'emoji de catégorie
  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'armes': '⚔️',
      'armure': '🛡️',
      'bijoux': '💎',
      'antiquités': '🏺',
      'livres': '📜',
      'potions': '🧪',
      'outils': '⚓',
      'vêtements': '👑',
      'nourriture': '🍖',
      'default': '💰'
    };
    return categoryMap[category?.toLowerCase()] || categoryMap.default;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-100 to-orange-200">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧭</div>
          <p className="text-amber-800 text-lg font-semibold">Exploration du coffre en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto p-6 min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: "url('/sac.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Superposition semi-transparente avec texture parchemin */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/70 to-yellow-900/70"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

      {/* Contenu principal avec z-index pour être au-dessus de la superposition */}
      <div className="relative z-10">
        {/* En-tête avec style pirate */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-amber-100 drop-shadow-lg flex items-center justify-center gap-3">
            <span className="text-5xl">🏴‍☠️</span>
            Mon Coffre au Trésor
            <span className="text-5xl">💰</span>
          </h1>
          <p className="text-amber-200 text-lg font-medium">
            Découvrez vos trésors collectés lors de votre aventure
          </p>
        </div>

        {/* Messages avec style thématique */}
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-amber-100/90 border-2 border-amber-600 shadow-lg">
            <p className={`font-semibold text-center ${
              message.includes("🏴‍☠️") || message.includes("💰") || message.includes("🗺️") 
                ? "text-amber-800" 
                : message.includes("⚔️") 
                ? "text-red-700" 
                : "text-green-700"
            }`}>
              {message}
            </p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">🏴‍☠️</div>
            <p className="text-2xl text-amber-100 font-semibold mb-4">
              Votre coffre au trésor est vide, moussaillon !
            </p>
            <p className="text-amber-200 text-lg">
              Partez à l'aventure pour découvrir des trésors extraordinaires !
            </p>
            <button
              onClick={() => router.push("/products")}
              className="mt-6 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              🗺️ Commencer l'aventure
            </button>
          </div>
        ) : (
          <div>
            {/* Grille des produits avec style trésor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl shadow-xl border-4 border-amber-400 relative overflow-hidden transform hover:scale-105 transition-all duration-200"
                  style={{
                    boxShadow: "0 8px 32px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                  }}
                >
                  {/* Coin supérieur décoratif */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-bl-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">💎</span>
                  </div>

                  {/* Icône de catégorie */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getCategoryEmoji(item.category)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-amber-900">
                        {item.name}
                      </h2>
                      <p className="text-sm text-amber-700 capitalize">
                        {item.category || "Trésor mystérieux"}
                      </p>
                    </div>
                  </div>

                  {/* Prix avec style pièces d'or */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-lg border-2 border-yellow-400">
                    <p className="text-amber-900 font-bold text-lg flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      {item.price.toFixed(2)} €
                    </p>
                    <p className="text-amber-700 text-sm">
                      + {Math.floor(item.price * 10)} pièces d'or de fidélité !
                    </p>
                  </div>

                  {/* Contrôles de quantité avec style aventurier */}
                  <div className="mb-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
                    <p className="text-amber-800 font-semibold mb-2 flex items-center gap-2">
                      <span>📦</span> Quantité dans le coffre :
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                        className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold text-lg hover:from-red-600 hover:to-red-700 transform hover:scale-110 transition-all duration-200 shadow-md"
                      >
                        -
                      </button>
                      <span className="mx-4 text-2xl font-bold text-amber-900 bg-white px-4 py-2 rounded-lg border-2 border-amber-400">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                        className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-green-700 transform hover:scale-110 transition-all duration-200 shadow-md"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bouton supprimer avec style pirate */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-bold hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                  >
                    <FaTrashAlt className="text-lg" />
                    Abandonner ce trésor
                  </button>
                </div>
              ))}
            </div>

            {/* Total et confirmation avec style grand trésor */}
            <div className="mt-8 p-8 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-2xl border-4 border-amber-500 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
                    <span className="text-4xl">🏆</span>
                    Valeur totale du trésor
                  </h2>
                  <p className="text-4xl font-bold text-amber-800 mt-2">
                    {totalAmount.toFixed(2)} €
                  </p>
                  <p className="text-amber-700 font-semibold mt-1">
                    + {Math.floor(totalAmount * 10)} pièces d'or de fidélité !
                  </p>
                </div>
                
                <button
                  onClick={confirmOrder}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-xl flex items-center gap-3"
                >
                  <span className="text-2xl">⚓</span>
                  Partir à l'aventure !
                  <span className="text-2xl">🗺️</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Chatbot />
      </div>
    </div>
  );
};

export default CartPage;