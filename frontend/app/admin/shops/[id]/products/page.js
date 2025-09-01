'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaGem, FaCoins, FaMap, FaCompass, FaBoxOpen } from 'react-icons/fa';

export default function TreasureProductsPage() {
  const router = useRouter();
  const { id: shopId } = useParams();
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les données de la boutique et ses produits
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentification requise');

        // Charger les infos de la boutique
        const shopResponse = await fetch(
          `http://localhost:5000/api/shops/admin/shops/${shopId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        // Charger les produits de la boutique
        const productsResponse = await fetch(
          `http://localhost:5000/api/products/by-shop?shopId=${shopId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!shopResponse.ok || !productsResponse.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const shopData = await shopResponse.json();
        const productsData = await productsResponse.json();

        setShopInfo(shopData);
        setProducts(productsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        if (err.message.includes('Authentification')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId, router]);

  const handleDeleteProduct = async (productId) => {
    if (!confirm('🏴‍☠️ Capitaine, êtes-vous sûr de vouloir retirer ce trésor de l\'inventaire ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Échec de la suppression du trésor');
      }

      // Mettre à jour la liste des produits
      setProducts(products.filter(product => product._id !== productId));
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-amber-800 font-semibold">🗺️ Exploration de l'inventaire en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 p-6">
        <div className="container mx-auto">
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-2">🚨 Problème dans l'expédition !</h3>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => router.push('/admin/shops')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              🧭 Retour au Port Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header avec style parchemin */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 text-white shadow-2xl">
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 rounded-full hover:bg-amber-700 transition-colors mr-4"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaBoxOpen className="mr-3 text-yellow-300" />
                Inventaire du Trésor
              </h1>
              <p className="text-amber-200 mt-1">
                📍 Navire de la Flotte: <span className="font-semibold text-yellow-300">{shopInfo?.name}</span>
              </p>
            </div>
          </div>

          {/* Infos de la boutique */}
          <div className="bg-amber-900/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <FaMap className="text-yellow-300 mr-2" />
                  <span className="text-amber-200">Territoire: </span>
                  <span className="font-semibold text-white">{shopInfo?.category}</span>
                </div>
                <div className="flex items-center">
                  <FaGem className="text-emerald-300 mr-2" />
                  <span className="text-amber-200">Trésors: </span>
                  <span className="font-bold text-yellow-300">{products.length}</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/shops/${shopId}/products/new`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors shadow-lg"
              >
                <FaPlus className="mr-2" /> 🏴‍☠️ Ajouter un Trésor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto p-6">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-amber-100 rounded-xl p-8 shadow-lg max-w-md mx-auto">
              <FaCompass className="text-6xl text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-amber-800 mb-2">🗺️ Coffre vide</h3>
              <p className="text-amber-700">Aucun trésor trouvé dans ce navire de la flotte</p>
              <p className="text-sm text-amber-600 mt-2">Le capitaine doit explorer de nouveaux territoires !</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product._id} className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {/* En-tête du produit */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-amber-900 mb-1 flex items-center">
                      <FaGem className="text-emerald-600 mr-2" />
                      {product.name}
                    </h3>
                    <p className="text-amber-700 text-sm bg-amber-200 px-2 py-1 rounded-full inline-block">
                      📍 {product.category}
                    </p>
                  </div>
                  {product.imageUrl && (
                    <div className="ml-4">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-amber-300 shadow-md"
                      />
                    </div>
                  )}
                </div>
                
                {/* Prix du trésor */}
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-3 rounded-lg mb-4 text-center">
                  <div className="flex items-center justify-center">
                    <FaCoins className="mr-2 text-xl" />
                    <span className="font-bold text-xl">{product.price}</span>
                    <span className="ml-1 text-sm">pièces d'or</span>
                  </div>
                </div>
                
                {/* Description */}
                <div className="bg-amber-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    📜 {product.description}
                  </p>
                </div>

                {/* Actions du capitaine */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => router.push(`/admin/shops/${shopId}/products/edit/${product._id}`)}
                    className="p-3 text-blue-600 hover:bg-blue-100 rounded-full transition-colors shadow-md hover:shadow-lg"
                    title="⚙️ Modifier ce trésor"
                  >
                    <FaEdit className="text-lg" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="p-3 text-red-600 hover:bg-red-100 rounded-full transition-colors shadow-md hover:shadow-lg"
                    title="🔥 Supprimer ce trésor"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer avec style carte au trésor */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 text-center py-6 mt-12">
        <p className="text-amber-200 text-sm">
          🏴‍☠️ <span className="font-bold text-yellow-300">Capitaine</span> | Gardien du Trésor Principal | Navigation vers la Fortune
        </p>
      </div>
    </div>
  );
}