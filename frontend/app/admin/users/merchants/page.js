"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaShip, 
  FaSync, 
  FaExclamationTriangle, 
  FaEye, 
  FaAnchor, 
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSearch,
  FaEdit,
  FaCompass,
  FaGem,
  FaMap,
  FaCrown,
  FaUsers,
  FaBinoculars
} from "react-icons/fa";

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMerchant, setNewMerchant] = useState({
    nom: "",
    email: "",
    motDePasse: "",
    role: "marchand",
    referralCode: ""
  });
  const [currentEditUser, setCurrentEditUser] = useState(null);

  const getBoutiqueName = (email) => {
    if (!email) return 'Île Mystérieuse';
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return 'Île Mystérieuse';
    return `Île ${email.substring(atIndex + 1).split('.')[0]}`;
  };

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Carte de navigation manquante");

      const response = await fetch("http://localhost:5000/api/users/marchands/list", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Accès au port refusé");
        if (response.status === 403) throw new Error("Rang insuffisant pour cette mission");
        throw new Error(`Tempête en mer: ${response.status}`);
      }

      const data = await response.json();
      setMerchants(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMerchantStatus = async (merchantId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${merchantId}/toggle-active`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) throw new Error("Impossible de changer le statut du navire");
      
      setMerchants(merchants.map(m => 
        m._id === merchantId ? { ...m, isActive: !m.isActive } : m
      ));
    } catch (err) {
      setError(err.message);
      fetchMerchants();
    }
  };

  const deleteMerchant = async (merchantId) => {
    if (!confirm("🏴‍☠️ Êtes-vous sûr de vouloir bannir définitivement ce membre d'équipage ?")) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${merchantId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error("Impossible de bannir ce membre");

      setMerchants(merchants.filter(m => m._id !== merchantId));
    } catch (err) {
      setError(err.message);
    }
  };

  const createMerchant = async (e) => {
    e.preventDefault();
    try {
      const emailDomain = newMerchant.email.split('@')[1];
      if (!emailDomain.includes('.')) {
        throw new Error("Adresse du port invalide - doit contenir un domaine valide");
      }

      const response = await fetch("http://localhost:5000/api/users/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...newMerchant,
          isActive: true,
          role: "marchand"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors du recrutement");
      }

      const data = await response.json();
      setMerchants([...merchants, data.user]);
      setShowCreateModal(false);
      setNewMerchant({
        nom: "",
        email: "",
        motDePasse: "",
        role: "marchand",
        referralCode: ""
      });
    } catch (err) {
      setError(err.message);
      console.error("Erreur recrutement:", err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${currentEditUser._id}/update`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nom: currentEditUser.nom,
            email: currentEditUser.email,
            ...(currentEditUser.motDePasse && { motDePasse: currentEditUser.motDePasse }),
            isActive: currentEditUser.isActive
          })
        }
      );

      if (!response.ok) throw new Error("Impossible de modifier les ordres");
      
      fetchMerchants();
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (merchant) => {
    setCurrentEditUser({
      ...merchant,
      motDePasse: "" // Ne pas afficher le mot de passe hashé
    });
    setShowEditModal(true);
  };

  const filteredMerchants = merchants.filter(merchant =>
    merchant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="container mx-auto">
        {/* Header avec thème pirate */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-lg p-6 mb-6 shadow-2xl border-4 border-amber-400">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <FaCrown className="text-yellow-300" />
                🏴‍☠️ Flotte Marchande du Capitaine
              </h1>
              <p className="text-amber-100 flex items-center gap-2">
                <FaShip /> {filteredMerchants.length} navires dans votre flotte
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCompass className="text-amber-600" />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Rechercher dans la flotte..."
                  className="pl-10 pr-4 py-3 border-2 border-amber-300 rounded-lg w-full bg-white/90 backdrop-blur-sm focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all font-semibold"
              >
                <FaPlus /> ⚓ Recruter Équipage
              </button>
            </div>
          </div>
        </div>

        {/* Grille des marchands avec thème aventure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map(merchant => (
            <div key={merchant._id} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-300 border border-amber-200 hover:border-amber-400 transform hover:scale-105">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-600 text-xl" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{merchant.nom}</h3>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <FaMap className="text-xs" />
                      {merchant.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    merchant.isActive 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {merchant.isActive ? '⚓ En Mer' : '🔒 Au Port'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                <div className="space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <FaGem className="text-blue-600" />
                    <span className="font-medium">Île:</span> 
                    <span className="text-blue-700 font-semibold">{getBoutiqueName(merchant.email)}</span>
                  </p>
                  {merchant.merchantId && (
                    <p className="text-sm flex items-center gap-2">
                      <FaCompass className="text-amber-600" />
                      <span className="font-medium">Code Navigateur:</span> 
                      <span className="text-amber-700 font-mono">{merchant.merchantId}</span>
                    </p>
                  )}
                  {merchant.referralCode && (
                    <p className="text-sm flex items-center gap-2">
                      <FaMap className="text-green-600" />
                      <span className="font-medium">Parrain:</span> 
                      <span className="text-green-700 font-semibold">{merchant.referralCode}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => router.push(`/admin/users/${merchant._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  title="🔭 Examiner le profil"
                >
                  <FaBinoculars />
                </button>
                <button
                  onClick={() => openEditModal(merchant)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  title="📝 Modifier les ordres"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => toggleMerchantStatus(merchant._id)}
                  className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all ${
                    merchant.isActive 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  title={merchant.isActive ? '🔒 Rappeler au port' : '⚓ Envoyer en mer'}
                >
                  {merchant.isActive ? <FaAnchor /> : <FaShip />}
                </button>
                <button
                  onClick={() => deleteMerchant(merchant._id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  title="🏴‍☠️ Bannir de la flotte"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de création avec thème pirate */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-4 border-amber-400">
              <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-6 rounded-t-lg">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaUsers /> ⚓ Recruter Nouveau Membre d'Équipage
                </h2>
              </div>
              
              <form onSubmit={createMerchant} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaUsers className="text-blue-600" />
                      Nom du Navigateur
                    </label>
                    <input
                      type="text"
                      value={newMerchant.nom}
                      onChange={(e) => setNewMerchant({...newMerchant, nom: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaMap className="text-green-600" />
                      Adresse du Port
                    </label>
                    <input
                      type="email"
                      value={newMerchant.email}
                      onChange={(e) => setNewMerchant({...newMerchant, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaCompass className="text-amber-600" />
                      Code Secret
                    </label>
                    <input
                      type="password"
                      value={newMerchant.motDePasse}
                      onChange={(e) => setNewMerchant({...newMerchant, motDePasse: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaMap className="text-purple-600" />
                      Code de Parrainage (optionnel)
                    </label>
                    <input
                      type="text"
                      value={newMerchant.referralCode}
                      onChange={(e) => setNewMerchant({...newMerchant, referralCode: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all font-semibold"
                  >
                    🚫 Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all font-semibold shadow-lg"
                  >
                    ⚓ Enrôler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal d'édition avec thème pirate */}
        {showEditModal && currentEditUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-4 border-amber-400">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-lg">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaEdit /> 📝 Modifier les Ordres du Navigateur
                </h2>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaUsers className="text-blue-600" />
                      Nom du Navigateur
                    </label>
                    <input
                      type="text"
                      value={currentEditUser.nom}
                      onChange={(e) => setCurrentEditUser({...currentEditUser, nom: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaMap className="text-green-600" />
                      Adresse du Port
                    </label>
                    <input
                      type="email"
                      value={currentEditUser.email}
                      onChange={(e) => setCurrentEditUser({...currentEditUser, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaCompass className="text-amber-600" />
                      Nouveau Code Secret (laisser vide pour ne pas changer)
                    </label>
                    <input
                      type="password"
                      value={currentEditUser.motDePasse}
                      onChange={(e) => setCurrentEditUser({...currentEditUser, motDePasse: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="Nouveau mot de passe..."
                    />
                  </div>

                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={currentEditUser.isActive}
                      onChange={(e) => setCurrentEditUser({...currentEditUser, isActive: e.target.checked})}
                      className="mr-3 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaShip className="text-blue-600" />
                      Navire en activité
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all font-semibold"
                  >
                    🚫 Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-semibold shadow-lg"
                  >
                    💾 Enregistrer les Ordres
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* États de chargement et d'erreur avec thème */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-amber-300">
              <div className="flex items-center gap-4">
                <FaSync className="animate-spin text-3xl text-amber-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-800">🧭 Navigation en cours...</p>
                  <p className="text-sm text-gray-600">Exploration de la flotte marchande</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mt-6 rounded-r-lg shadow-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
              <div>
                <p className="font-semibold text-red-800">⚠️ Tempête détectée !</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredMerchants.length === 0 && merchants.length > 0 && (
          <div className="text-center py-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-amber-300">
              <FaCompass className="text-6xl text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">🗺️ Aucun navire trouvé</h3>
              <p className="text-gray-600">Aucun membre d'équipage trouvé pour "{searchTerm}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}