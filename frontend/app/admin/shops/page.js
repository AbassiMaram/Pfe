'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaMap, 
  FaEye, 
  FaCompass, 
  FaShip, 
  FaAnchor, 
  FaBoxOpen, // Remplacement de FaTreasureChest
  FaBinoculars, // Remplacement de FaSpyglass
  FaFlag,
  FaSkullCrossbones,
  FaGem
} from 'react-icons/fa';

export default function ShopsManager() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentification du capitaine requise');
        }

        const response = await fetch('http://localhost:5000/api/shops/admin/shops', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('⚠️ Accès refusé : seul le capitaine peut gouverner les îles');
          }
          throw new Error(`🌊 Tempête en mer! Statut: ${response.status}`);
        }

        const data = await response.json();
        setShops(data);
      } catch (err) {
        console.error('Erreur de navigation:', err);
        setError(err.message);
        if (err.message.includes('Authentification')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [router]);

  const handleDelete = async (shopId) => {
    if (!confirm('🏴‍☠️ Êtes-vous sûr de vouloir abandonner cette île ? Cette action est irréversible !')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/shops/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('⚔️ Échec de l\'abandon de l\'île');
      }

      setShops(shops.filter(shop => shop._id !== shopId));
    } catch (err) {
      console.error('Erreur d\'abandon:', err);
      setError(err.message);
    }
  };

  // Fonction pour obtenir l'icône selon la catégorie
  const getCategoryIcon = (category) => {
    const icons = {
      'mode': '👗',
      'electronique': '⚡',
      'alimentaire': '🍖',
      'beaute': '💎',
      'sport': '⚔️',
      'maison': '🏠',
      'livre': '📚',
      'default': '🏴‍☠️'
    };
    return icons[category?.toLowerCase()] || icons.default;
  };

  // Fonction pour obtenir la couleur selon la catégorie
  const getCategoryColor = (category) => {
    const colors = {
      'mode': 'bg-pink-500/20 text-pink-300 border-pink-400/30',
      'electronique': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      'alimentaire': 'bg-green-500/20 text-green-300 border-green-400/30',
      'beaute': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      'sport': 'bg-red-500/20 text-red-300 border-red-400/30',
      'maison': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'livre': 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      'default': 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400"></div>
            <p className="text-white mt-4 text-lg flex items-center">
              <FaCompass className="mr-2 animate-pulse" />
              🌊 Exploration des îles en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900">
        <div className="container mx-auto p-4">
          <div className="bg-red-900/50 border-l-4 border-red-500 p-6 rounded-r-lg backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <FaSkullCrossbones className="text-red-400 mr-2" />
              <p className="text-red-200 text-lg">Erreur: {error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <FaAnchor className="mr-2" />
              Reprendre la Navigation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center text-yellow-300">
            <FaMap className="mr-3" />
            🏴‍☠️ Gouvernance des Îles
          </h1>
          <button
            onClick={() => router.push('/admin/shops/new')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-colors shadow-lg"
          >
            <FaPlus className="mr-2" /> 
            🏝️ Découvrir Nouvelle Île
          </button>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaShip className="text-yellow-400 mr-3 text-2xl" />
              <div>
                <h2 className="text-xl font-bold text-yellow-300">Archipel du Capitaine</h2>
                <p className="text-blue-200">Gouvernez vos îles marchandes avec sagesse</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{shops.length}</p>
              <p className="text-blue-200 text-sm">🏝️ Îles sous contrôle</p>
            </div>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-12 text-center border border-yellow-400/30">
            <FaCompass className="text-6xl text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-300 text-xl mb-2">🌊 Aucune île découverte</p>
            <p className="text-blue-200">Commencez votre expédition en découvrant votre première île marchande</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(shop => (
              <div key={shop._id} className="bg-black/30 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaFlag className="text-yellow-400 mr-2" />
                    <h3 className="font-bold text-lg text-white">{shop.name}</h3>
                  </div>
                  <span className="text-2xl">
                    {getCategoryIcon(shop.category)}
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(shop.category)}`}>
                    🏴‍☠️ {shop.category}
                  </span>
                </div>
                
                <p className="text-blue-200 text-sm mb-4 line-clamp-2">
                  {shop.description || "Une île mystérieuse remplie de trésors à découvrir..."}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-yellow-300">
                    <FaBoxOpen className="mr-2" />
                    <span className="text-sm">
                      {shop.products?.length || 0} trésors
                    </span>
                  </div>
                  <div className="flex items-center text-blue-200">
                    <FaGem className="mr-2" />
                    <span className="text-sm">Île active</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/shops/${shop._id}/products`)}
                      className="p-2 text-green-400 hover:bg-green-600/20 rounded-full transition-colors"
                      title="Explorer les trésors"
                    >
                      <FaBinoculars />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/shops/edit/${shop._id}`)}
                      className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-full transition-colors"
                      title="Modifier l'île"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(shop._id)}
                      className="p-2 text-red-400 hover:bg-red-600/20 rounded-full transition-colors"
                      title="Abandonner l'île"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="flex items-center text-yellow-400">
                    <FaAnchor className="mr-1" />
                    <span className="text-xs">Contrôlée</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
          <div className="flex items-center justify-center text-blue-200">
            <FaCompass className="mr-2 text-yellow-400" />
            <span className="text-sm">
              🏴‍☠️ En tant que Capitaine, vous gouvernez {shops.length} îles dans votre archipel marchand
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}