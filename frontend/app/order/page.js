"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_51PZC2YCjT7zmyc7u4ijqte1k2ak2KtVSS4l3M8ohpYjvZ4M5e3JAVPRConbXlmMDWcLkh7H9JF0tWzzfLynjBuDr00mNIwipzd");

// Widget Mini-Carte au Trésor
const TreasureProgressWidget = ({ loyaltyPoints, greenPoints = 0 }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const levels = [
    { threshold: 0, name: "Matelot", icon: "⚓", treasure: "🪙" },
    { threshold: 250, name: "Corsaire", icon: "⚔️", treasure: "💰" },
    { threshold: 500, name: "Capitaine", icon: "🏴‍☠️", treasure: "💎" },
    { threshold: 1000, name: "Amiral", icon: "👑", treasure: "🏆" }
  ];

  useEffect(() => {
    const level = levels.findLastIndex(l => loyaltyPoints + greenPoints >= l.threshold);
    setCurrentLevel(level >= 0 ? level : 0);
  }, [loyaltyPoints, greenPoints]);

  const nextLevel = levels[currentLevel + 1];
  const progress = nextLevel ? 
    ((loyaltyPoints + greenPoints - levels[currentLevel].threshold) / (nextLevel.threshold - levels[currentLevel].threshold)) * 100 
    : 100;

  return (
    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-400 rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levels[currentLevel].icon}</span>
          <span className="font-bold text-amber-800">{levels[currentLevel].name}</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-amber-700">Pièces d'or</div>
          <div className="font-bold text-amber-900">💰 {loyaltyPoints}</div>
          {greenPoints > 0 && (
            <div className="font-bold text-green-700">🍃 +{greenPoints} points verts</div>
          )}
        </div>
      </div>
      
      {nextLevel && (
        <>
          <div className="flex items-center justify-between text-sm text-amber-700 mb-2">
            <span>Prochain trésor: {nextLevel.treasure}</span>
            <span>{nextLevel.threshold - (loyaltyPoints + greenPoints)} pièces restantes</span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-xs text-amber-600">
            🗺️ {progress.toFixed(0)}% vers le prochain niveau
          </div>
        </>
      )}
    </div>
  );
};

// Composant Article du Trésor
const TreasureItem = ({ item }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      'vêtements': '👗',
      'chaussures': '👠',
      'accessoires': '💍',
      'bijoux': '💎',
      'sacs': '👜',
      'montres': '⌚',
      'parfums': '🧴',
      'default': '🏺'
    };
    
    const normalizedCategory = category?.toLowerCase() || 'default';
    return icons[normalizedCategory] || icons['default'];
  };

  return (
    <div className="bg-white border-2 border-amber-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 w-8 h-8 bg-amber-200 transform rotate-45 translate-x-4 -translate-y-4"></div>
      
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
        <h3 className="text-lg font-bold text-amber-900">{item.name}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-amber-700">Prix du trésor:</span>
          <span className="font-bold text-amber-900">{item.price.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-amber-700">Quantité:</span>
          <span className="font-bold text-amber-900">×{item.quantity}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-amber-700">Catégorie:</span>
          <span className="font-semibold text-amber-800">{item.category || "Non spécifiée"}</span>
        </div>
        
        <div className="border-t border-amber-300 pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-amber-700">Total du trésor:</span>
            <span className="font-bold text-amber-900 text-lg">{(item.price * item.quantity).toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Formulaire de Livraison Pirate
const PirateShippingForm = ({ formData, handleInputChange }) => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🗺️</span>
        <h2 className="text-xl font-bold text-amber-900">Coordonnées de Livraison</h2>
        <span className="text-2xl">🏴‍☠️</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-amber-800 font-semibold mb-2">
            ⚓ Prénom du Matelot
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
            placeholder="Votre prénom de pirate..."
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-amber-800 font-semibold mb-2">
            ⚔️ Nom de Famille
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
            placeholder="Nom de votre équipage..."
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="address" className="block text-amber-800 font-semibold mb-2">
          🏝️ Adresse du Port
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
          placeholder="Où livrer votre trésor..."
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mb-4">
          <label htmlFor="city" className="block text-amber-800 font-semibold mb-2">
            🏰 Ville Portuaire
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
            placeholder="Votre ville..."
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="postalCode" className="block text-amber-800 font-semibold mb-2">
            📮 Code du Port
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
            placeholder="Code postal..."
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="country" className="block text-amber-800 font-semibold mb-2">
            🌍 Royaume
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
            required
          >
            <option value="">🏴‍☠️ Choisir un royaume...</option>
            <option value="France">🇫🇷 France</option>
            <option value="Canada">🇨🇦 Canada</option>
            <option value="Maroc">🇲🇦 Maroc</option>
            <option value="Allemagne">🇩🇪 Allemagne</option>
            <option value="Espagne">🇪🇸 Espagne</option>
            <option value="Italie">🇮🇹 Italie</option>
            <option value="Belgique">🇧🇪 Belgique</option>
            <option value="Suisse">🇨🇭 Suisse</option>
            <option value="Tunisie">🇹🇳 Tunisie</option>
            <option value="Algérie">🇩🇿 Algérie</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Composant Île aux Trésors Verts - Version Écologique avec Image et Produits Éco
const GreenTreasureIsland = ({ onPackagingChange, onEcoProductsChange, totalAmount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState(null);
  const [selectedEcoProducts, setSelectedEcoProducts] = useState([]);
  const [greenPoints, setGreenPoints] = useState(0);

  const packagingOptions = [
    {
      id: 'standard',
      name: 'Emballage Standard',
      icon: '📦',
      points: 0,
      price: 0,
      description: 'Emballage classique du capitaine',
      badge: null,
      color: 'gray',
      impact: 'Aucun impact écologique'
    },
    {
      id: 'minimal',
      name: 'Emballage Minimal',
      icon: '📋',
      points: 20,
      price: 0,
      description: 'Économise 60% de matières',
      badge: 'Minimaliste 🌱',
      color: 'green',
      eco: true,
      impact: '60% moins de déchets'
    },
    {
      id: 'reusable',
      name: 'Emballage Réutilisable',
      icon: '♻️',
      points: 50,
      price: 2,
      description: 'Sac premium réutilisable',
      badge: 'Gardien Vert 🌳',
      color: 'emerald',
      eco: true,
      impact: 'Réutilisable 100+ fois'
    },
    {
      id: 'consignment',
      name: 'Emballage Consigné',
      icon: '🔄',
      points: 30,
      price: 2,
      refund: 2,
      description: 'Remboursé au retour',
      badge: 'Économie Circulaire 🌍',
      color: 'blue',
      eco: true,
      impact: 'Zéro déchet final'
    }
  ];

  const ecoProducts = [
    {
      id: 'shampoo',
      name: 'Shampoing Solide',
      icon: '🧴',
      points: 15,
      price: 12.99,
      description: 'Shampoing bio sans plastique',
      impact: 'Zéro déchet plastique',
      color: 'emerald',
      category: 'Soins'
    },
    {
      id: 'sponge',
      name: 'Éponge Bambou',
      icon: '🧽',
      points: 10,
      price: 8.50,
      description: 'Éponge naturelle biodégradable',
      impact: '100% compostable',
      color: 'amber',
      category: 'Maison'
    },
    {
      id: 'mug',
      name: 'Mug Réutilisable',
      icon: '☕',
      points: 25,
      price: 15.99,
      description: 'Mug écologique en bambou',
      impact: 'Remplace 500 gobelets',
      color: 'teal',
      category: 'Cuisine'
    },
    {
      id: 'toothbrush',
      name: 'Brosse à Dents Bambou',
      icon: '🪥',
      points: 12,
      price: 6.99,
      description: 'Brosse biodégradable',
      impact: 'Alternative au plastique',
      color: 'lime',
      category: 'Soins'
    },
    {
      id: 'bag',
      name: 'Sac en Coton Bio',
      icon: '🛍️',
      points: 18,
      price: 9.99,
      description: 'Sac de courses réutilisable',
      impact: 'Remplace 1000 sacs plastique',
      color: 'green',
      category: 'Pratique'
    },
    {
      id: 'soap',
      name: 'Savon Artisanal',
      icon: '🧼',
      points: 8,
      price: 4.99,
      description: 'Savon naturel fait main',
      impact: 'Sans chimiques nocifs',
      color: 'purple',
      category: 'Soins'
    }
  ];

  const handlePackagingSelect = (option) => {
    if (selectedPackaging?.id === option.id) {
      setSelectedPackaging(null);
      const ecoProductsPoints = selectedEcoProducts.reduce((sum, product) => sum + product.points, 0);
      setGreenPoints(ecoProductsPoints);
      if (onPackagingChange) onPackagingChange(null);
    } else {
      setSelectedPackaging(option);
      const packagingPoints = option.points;
      const ecoProductsPoints = selectedEcoProducts.reduce((sum, product) => sum + product.points, 0);
      setGreenPoints(packagingPoints + ecoProductsPoints);
      if (onPackagingChange) {
        onPackagingChange({
          type: option.id,
          name: option.name,
          points: option.points,
          price: option.price || 0,
          refund: option.refund || 0
        });
      }
    }
  };

  const handleEcoProductToggle = (product) => {
    const newSelectedProducts = selectedEcoProducts.find(p => p.id === product.id)
      ? selectedEcoProducts.filter(p => p.id !== product.id)
      : [...selectedEcoProducts, product];
    
    setSelectedEcoProducts(newSelectedProducts);
    
    const packagingPoints = selectedPackaging?.points || 0;
    const ecoProductsPoints = newSelectedProducts.reduce((sum, p) => sum + p.points, 0);
    setGreenPoints(packagingPoints + ecoProductsPoints);
    
    if (onEcoProductsChange) {
      onEcoProductsChange(newSelectedProducts);
    }
  };

  const totalEcoProductsPrice = selectedEcoProducts.reduce((sum, product) => sum + product.price, 0);

  return (
    <>
      {/* Île Verte Cliquable avec Image */}
      <div className="mb-6 flex justify-center">
        <div 
          onClick={() => setIsOpen(true)}
          className="relative cursor-pointer group transform hover:scale-105 transition-all duration-500"
        >
          {/* Container principal de l'île */}
          <div className="relative">
            {/* Image de l'île avec effets */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-emerald-400 group-hover:border-emerald-500 transition-all duration-300">
              {/* Image de l'île */}
              <img
                src="/verte1.jpg"
                alt="Île verte"
                className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110 relative overflow-hidden"
              />
              
              {/* Overlay avec effet brillant */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Effets de particules flottantes */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-60"></div>
                <div className="absolute top-4 right-3 w-1 h-1 bg-emerald-300 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-3 left-4 w-1 h-1 bg-teal-300 rounded-full animate-bounce delay-500"></div>
              </div>
            </div>
            
            {/* Effet d'eau ondulante en dessous */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-36 h-8 bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 rounded-full opacity-80"></div>
            
            {/* Badge points verts flottant */}
            {greenPoints > 0 && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg animate-bounce border-2 border-white">
                🍃 +{greenPoints}
              </div>
            )}
            
            {/* Texte d'invitation avec design amélioré */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 border-2 border-emerald-400 rounded-full px-4 py-2 shadow-xl backdrop-blur-sm">
                <span className="text-emerald-800 font-bold text-sm flex items-center gap-2">
                  <span className="animate-bounce">🗺️</span>
                  Explorez l'île écologique !
                  <span className="animate-bounce delay-200">🌿</span>
                </span>
              </div>
            </div>
            
            {/* Effet de ring au survol */}
            <div className="absolute inset-0 rounded-full group-hover:ring-4 group-hover:ring-emerald-300 group-hover:ring-opacity-50 transition-all duration-300"></div>
            
            {/* Effet de lueur magique */}
            <div className="absolute inset-0 rounded-full group-hover:shadow-emerald-400/50 group-hover:shadow-2xl transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Modal Écologique */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Fenêtre principale avec design naturel */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl shadow-2xl border-4 border-emerald-400 overflow-hidden relative">
              {/* Motif de feuilles en arrière-plan */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 text-6xl rotate-12">🌿</div>
                <div className="absolute top-8 right-12 text-5xl -rotate-12">🍃</div>
                <div className="absolute bottom-8 left-8 text-7xl rotate-45">🌱</div>
                <div className="absolute bottom-12 right-4 text-6xl -rotate-45">🌳</div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-30">🏝️</div>
              </div>

              {/* En-tête naturel avec image de l'île */}
              <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 overflow-hidden">
                {/* Effet de nuages */}
                <div className="absolute top-0 left-0 w-full h-full">
                  <div className="absolute top-2 left-4 w-16 h-8 bg-white opacity-20 rounded-full"></div>
                  <div className="absolute top-4 right-8 w-12 h-6 bg-white opacity-15 rounded-full"></div>
                  <div className="absolute top-1 right-20 w-20 h-10 bg-white opacity-10 rounded-full"></div>
                </div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Miniature de l'île dans l'en-tête */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center">
                        <img src="/verte1.jpg" alt="Mini île" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    </div>
                    
                    <div>
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        Île aux Trésors Verts
                      </h2>
                      <p className="text-emerald-100 text-lg drop-shadow">
                        Choisissez votre aventure écologique ! 🌿
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-4xl animate-bounce">🌳</span>
                      <span className="text-4xl animate-bounce delay-200">🦋</span>
                      <span className="text-4xl animate-bounce delay-400">🌺</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-3xl text-white hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:rotate-90"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="relative p-8 max-h-[70vh] overflow-y-auto">
                {/* Indicateur d'impact écologique */}
                <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 border-3 border-emerald-400 rounded-2xl p-6 mb-8 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-4 text-4xl">🌿</div>
                    <div className="absolute bottom-2 left-4 text-4xl">🍃</div>
                  </div>
                  
                  <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="text-3xl">🌱</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      </div>
                      <span className="font-bold text-emerald-900 text-xl">Votre Impact Écologique</span>
                    </div>
                    <div className="text-right bg-white/50 rounded-xl p-3 border-2 border-emerald-300">
                      <div className="text-sm text-emerald-700 font-semibold">Points Verts Gagnés</div>
                      <div className="font-bold text-emerald-900 text-2xl flex items-center gap-2">
                        <span className="animate-bounce">🍃</span>
                        <span>{greenPoints}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPackaging && selectedPackaging.eco && (
                    <div className="bg-gradient-to-r from-emerald-200 to-teal-200 border-2 border-emerald-400 rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-300 transform rotate-45 translate-x-4 -translate-y-4"></div>
                      <div className="flex items-center gap-3 text-emerald-800">
                        <span className="text-2xl animate-bounce">{selectedPackaging.icon}</span>
                        <div>
                          <div className="font-bold text-lg">{selectedPackaging.badge}</div>
                          <div className="text-sm opacity-80">{selectedPackaging.impact}</div>
                        </div>
                        <span className="text-2xl ml-auto">🏆</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ÉTAPE 1: Options d'emballage */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                    <h3 className="text-2xl font-bold text-emerald-800">ÉTAPE 1: Choisir votre emballage</h3>
                    <span className="text-2xl animate-bounce">📦</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packagingOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handlePackagingSelect(option)}
                        className={`relative border-3 rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                          selectedPackaging?.id === option.id
                            ? `border-${option.color}-500 bg-${option.color}-50 shadow-2xl ring-4 ring-${option.color}-200`
                            : `border-${option.color}-200 hover:border-${option.color}-400 bg-white hover:shadow-xl`
                        } overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-12 h-12 bg-${option.color}-200 transform rotate-45 translate-x-6 -translate-y-6`}></div>
                        
                        {selectedPackaging?.id === option.id && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-lg">✓</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <span className="text-3xl">{option.icon}</span>
                              {option.eco && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white">🌿</span>
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{option.name}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="text-gray-600 font-medium">{option.description}</div>
                          <div className="text-emerald-700 font-semibold bg-emerald-100 rounded-lg p-2">
                            🌱 Impact: {option.impact}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <span className="animate-pulse">🍃</span>
                              +{option.points} points verts
                            </span>
                            {option.price > 0 && (
                              <span className="text-gray-700 font-semibold">
                                +{option.price.toFixed(2)} €
                              </span>
                            )}
                          </div>
                          
                          {option.refund && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                              <div className="text-blue-600 font-semibold flex items-center gap-1">
                                <span>💰</span>
                                {option.refund.toFixed(2)} € remboursés au retour
                              </div>
                            </div>
                          )}
                          
                          {option.badge && (
                            <div className="bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 px-3 py-2 rounded-full text-xs font-bold text-center border border-emerald-300">
                              🏆 {option.badge}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ÉTAPE 2: Produits éco suggérés (indépendante) */}
                <div className="mb-8 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold animate-pulse">2</div>
                    <h3 className="text-2xl font-bold text-emerald-800">ÉTAPE 2: Produits éco suggérés</h3>
                    <span className="text-2xl animate-bounce">🌱</span>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl animate-bounce">🎉</span>
                      <div>
                        <h4 className="text-lg font-bold text-emerald-800">Découvrez nos produits durables !</h4>
                        <p className="text-emerald-600">Ajoutez des produits éco-responsables à votre aventure</p>
                      </div>
                    </div>
                    
                    {selectedEcoProducts.length > 0 && (
                      <div className="bg-white border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-700 font-bold">Produits éco sélectionnés: {selectedEcoProducts.length}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-emerald-700 font-bold">+{selectedEcoProducts.reduce((sum, p) => sum + p.points, 0)} points verts 🍃</span>
                            <span className="text-gray-700 font-bold">+{totalEcoProductsPrice.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ecoProducts.map((product) => {
                      const isSelected = selectedEcoProducts.find(p => p.id === product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleEcoProductToggle(product)}
                          className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isSelected
                              ? `border-${product.color}-500 bg-${product.color}-50 shadow-lg ring-2 ring-${product.color}-200`
                              : `border-${product.color}-200 hover:border-${product.color}-400 bg-white hover:shadow-md`
                          }`}
                        >
                          {/* Badge de sélection */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                          
                          {/* Badge catégorie */}
                          <div className={`absolute top-2 left-2 bg-${product.color}-200 text-${product.color}-800 px-2 py-1 rounded-full text-xs font-semibold`}>
                            {product.category}
                          </div>
                          
                          <div className="flex flex-col items-center text-center pt-6">
                            <div className="text-4xl mb-3 relative">
                              {product.icon}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">🌿</span>
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-gray-800 mb-2">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                            
                            <div className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-2 py-1 mb-3">
                              🌱 {product.impact}
                            </div>
                            
                            <div className="flex items-center justify-between w-full text-sm">
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <span>🍃</span>
                                +{product.points} pts
                              </span>
                              <span className="font-bold text-gray-700">
                                {product.price.toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>🚪</span>
                      <span>Fermer sans choisir</span>
                    </div>
                  </button>
                  {(selectedPackaging || selectedEcoProducts.length > 0) && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-bounce">🏴‍☠️</span>
                        <span>Confirmer mes choix éco-pirates !</span>
                        <span className="animate-bounce delay-200">🌿</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
};

// Formulaire de Paiement Pirate - CORRIGÉ
const PiratePaymentForm = ({ totalAmount, onSuccess, formData, packagingInfo, ecoProducts }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const finalAmount = totalAmount + (packagingInfo?.price || 0) + (ecoProducts?.reduce((sum, p) => sum + p.price, 0) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.address || 
        !formData.city || !formData.postalCode || !formData.country) {
      setError("🏴‍☠️ Capitaine ! Veuillez remplir toutes les coordonnées de livraison avant de payer !");
      return;
    }

    if (!stripe || !elements) {
      setError("Stripe n'est pas encore chargé. Veuillez patienter.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Élément de carte non trouvé.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("🚀 Envoi au backend:", { amount: finalAmount * 100 });
      const response = await fetch("http://localhost:5000/api/order/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          amount: finalAmount * 100,
          packaging: packagingInfo,
          ecoProducts: ecoProducts
        }),
      });

      const responseText = await response.text();
      console.log("📡 Réponse backend:", response.status, responseText);

      if (!response.ok) {
        throw new Error(`Erreur serveur ${response.status}: ${responseText}`);
      }

      const { clientSecret } = JSON.parse(responseText);
      console.log("🔐 Client secret reçu:", clientSecret ? "✅" : "❌");

      if (!clientSecret) {
        throw new Error("Client secret manquant dans la réponse");
      }

      console.log("💳 Confirmation du paiement avec Stripe...");
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            address: {
              line1: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              country: formData.country === "France" ? "FR" : "FR",
            },
          },
        },
      });

      console.log("🎯 Résultat du paiement:", result);

      if (result.error) {
        console.error("❌ Erreur de paiement:", result.error);
        setError(`Erreur de paiement: ${result.error.message}`);
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        console.log("✅ Paiement réussi:", result.paymentIntent.id);
        setError(null);
        onSuccess(result.paymentIntent.id);
      } else {
        console.error("❌ Statut de paiement inattendu:", result.paymentIntent?.status);
        setError("Statut de paiement inattendu. Veuillez contacter le support.");
      }
    } catch (err) {
      console.error("💥 Erreur lors du processus de paiement:", err);
      setError(err.message || "Erreur lors du paiement. Veuillez réessayer.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💰</span>
        <h2 className="text-xl font-bold text-green-800">Paiement du Trésor</h2>
        <span className="text-2xl">💎</span>
      </div>
      
      <div className="bg-white border border-green-300 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-700">Sous-total produits:</span>
          <span className="font-semibold">{totalAmount.toFixed(2)} €</span>
        </div>
        {packagingInfo && packagingInfo.price > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-700">Emballage éco ({packagingInfo.name}):</span>
            <span className="font-semibold">+{packagingInfo.price.toFixed(2)} €</span>
          </div>
        )}
        {packagingInfo?.refund && (
          <div className="flex justify-between items-center mb-2 text-blue-600">
            <span>Remboursement au retour:</span>
            <span className="font-semibold">-{packagingInfo.refund.toFixed(2)} €</span>
          </div>
        )}
        {ecoProducts && ecoProducts.length > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-700">Produits éco:</span>
            <span className="font-semibold">+{(ecoProducts.reduce((sum, p) => sum + p.price, 0)).toFixed(2)} €</span>
          </div>
        )}
        <hr className="my-2" />
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total à payer:</span>
          <span>{finalAmount.toFixed(2)} €</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-green-800 font-semibold mb-2">
            💳 Informations de la Carte au Trésor
          </label>
          <div className="p-4 border-2 border-green-300 rounded-lg bg-white">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || processing}
          className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-200 ${
            !stripe || processing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚓</span>
              <span>Navigation en cours...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>💰</span>
              <span>Payer {finalAmount.toFixed(2)} € pour le Trésor</span>
              <span>🏴‍☠️</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

// Page Principale - CORRIGÉE
const TreasureOrderPage = () => {
  const router = useRouter();
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [multipliers, setMultipliers] = useState({});
  const [packagingInfo, setPackagingInfo] = useState(null);
  const [ecoProducts, setEcoProducts] = useState([]);

  useEffect(() => {
    const loadPendingOrderAndMultipliers = async () => {
      try {
        const merchantId = "zara";
        const token = localStorage.getItem("token");
        
        const multipliersResponse = await fetch(
          `http://192.168.43.57:5000/api/merchant/points-config?merchantId=${merchantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (multipliersResponse.ok) {
          const { pointsConfig } = await multipliersResponse.json();
          setMultipliers(pointsConfig.multipliers || {});
          console.log("✅ Multiplicateurs récupérés:", pointsConfig.multipliers);
        } else {
          console.warn("⚠️ Impossible de récupérer les multiplicateurs");
        }

        const pendingOrder = localStorage.getItem("pendingOrder");
        if (!pendingOrder) {
          console.warn("⚠️ Aucune commande en attente trouvée.");
          setLoading(false);
          return;
        }

        const orderData = JSON.parse(pendingOrder);
        console.log("📦 Données de la commande en attente:", orderData);

        const itemsWithNames = await Promise.all(
          orderData.items.map(async (item) => {
            try {
              const response = await fetch(`http://localhost:5000/api/products/${item.productId}`, {
                headers: {
                  Authorization: `Bearer ${token || ""}`,
                },
              });
              if (response.ok) {
                const productData = await response.json();
                return { ...item, name: productData.name || "Produit inconnu" };
              } else {
                console.warn(`⚠️ Impossible de récupérer le produit ${item.productId}`);
                return { ...item, name: "Produit inconnu" };
              }
            } catch (err) {
              console.error(`❌ Erreur récupération nom pour productId ${item.productId}:`, err);
              return { ...item, name: "Produit inconnu" };
            }
          })
        );

        setOrderItems(itemsWithNames);
        setTotalAmount(orderData.totalAmount || 0);
        setLoading(false);
      } catch (error) {
        console.error("💥 Erreur lors du chargement:", error);
        setLoading(false);
      }
    };

    loadPendingOrderAndMultipliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackagingChange = (info) => {
    setPackagingInfo(info);
  };

  const handleEcoProductsChange = (products) => {
    setEcoProducts(products);
  };

  const confirmOrderSubmission = async (paymentIntentId) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    console.log("🔍 Données de confirmation:", {
      token: token ? "✅" : "❌",
      userId: userId ? "✅" : "❌",
      paymentIntentId: paymentIntentId ? "✅" : "❌",
      formData
    });

    if (!token) {
      alert("🏴‍☠️ Token d'authentification manquant ! Veuillez vous reconnecter.");
      return;
    }

    if (!userId) {
      alert("🏴‍☠️ ID utilisateur manquant ! Veuillez vous reconnecter.");
      return;
    }

    const merchantId = "zara";

    const requestBody = {
      userId,
      merchantId,
      items: orderItems,
      totalAmount: totalAmount + (packagingInfo?.price || 0) + (ecoProducts?.reduce((sum, p) => sum + p.price, 0) || 0),
      shippingAddress: { ...formData },
      paymentIntentId,
      packaging: packagingInfo,
      ecoProducts: ecoProducts
    };

    console.log("📡 Données envoyées à /confirm:", requestBody);

    try {
      const response = await fetch("http://localhost:5000/api/order/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("📨 Réponse /confirm:", response.status, responseText);

      if (!response.ok) {
        throw new Error(responseText || "Erreur lors de la confirmation");
      }

      const data = JSON.parse(responseText);
      console.log("✅ Commande confirmée:", data);

      localStorage.setItem("lastOrderId", data.order._id);
      alert("🏴‍☠️ Félicitations ! Votre trésor a été commandé avec succès ! 💰");
      localStorage.removeItem("pendingOrder");
      localStorage.removeItem("cart");
      router.push("/thank");
    } catch (error) {
      console.error("❌ Erreur lors de la confirmation:", error.message);
      alert(`⚠️ Erreur du capitaine : ${error.message}`);
    }
  };

  const loyaltyPoints = orderItems.reduce((totalPoints, item) => {
    const normalizedCategory = item.category
      ? item.category
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : "default";
    
    let multiplier = 1.0;
    for (const [key, value] of Object.entries(multipliers)) {
      const normalizedKey = key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalizedKey === normalizedCategory) {
        multiplier = value;
        break;
      }
    }
    return totalPoints + (item.price * item.quantity * multiplier * 10);
  }, 0);

  const greenPoints = (packagingInfo?.points || 0) + (ecoProducts?.reduce((sum, p) => sum + p.points, 0) || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏴‍☠️</div>
          <div className="text-xl text-blue-800 font-semibold">Navigation vers le trésor en cours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🏴‍☠️</span>
            <h1 className="text-4xl font-bold text-blue-900">Confirmation du Trésor</h1>
            <span className="text-4xl">⚓</span>
          </div>
          <p className="text-blue-700 text-lg">Préparez-vous à recevoir votre butin, moussaillon !</p>
        </div>

        {orderItems.length > 0 ? (
          <>
            <TreasureProgressWidget loyaltyPoints={loyaltyPoints} greenPoints={greenPoints} />

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🗝️</span>
                <h2 className="text-2xl font-bold text-amber-900">Inventaire du Trésor</h2>
                <span className="text-2xl">💎</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {orderItems.map((item) => (
                  <TreasureItem key={item.productId} item={item} />
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-400 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between text-2xl font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <span>🏴‍☠️</span>
                    <span>Valeur Totale du Trésor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{totalAmount.toFixed(2)} €</span>
                    <span>💰</span>
                  </div>
                </div>
                <div className="text-center mt-3 text-blue-700">
                  <span className="text-lg font-semibold">
                    🪙 Pièces d'or à recevoir: {Math.round(loyaltyPoints)} points de fidélité
                  </span>
                  {greenPoints > 0 && (
                    <span className="text-lg font-semibold text-green-700">
                      {" "}+ 🍃 {greenPoints} points verts
                    </span>
                  )}
                </div>
              </div>
            </div>

            <GreenTreasureIsland onPackagingChange={handlePackagingChange} onEcoProductsChange={handleEcoProductsChange} totalAmount={totalAmount} />

            <PirateShippingForm formData={formData} handleInputChange={handleInputChange} />

            <Elements stripe={stripePromise}>
              <PiratePaymentForm 
                totalAmount={totalAmount} 
                onSuccess={confirmOrderSubmission}
                formData={formData}
                packagingInfo={packagingInfo}
                ecoProducts={ecoProducts}
              />
            </Elements>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏴‍☠️</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Aucun trésor en attente</h2>
            <p className="text-blue-700 text-lg">Il semble que votre coffre soit vide, capitaine !</p>
            <button 
              onClick={() => router.push("/")}
              className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
            >
              🗺️ Partir à la recherche de trésors
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasureOrderPage;