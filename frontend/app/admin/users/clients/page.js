"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaUsers, 
  FaSync, 
  FaExclamationCircle, 
  FaEye, 
  FaPowerOff, 
  FaPlus, 
  FaTrash,
  FaSearch,
  FaEdit,
  FaHistory,
  FaAnchor,
  FaShip,
  FaCompass,
  FaSkull,
  FaMapMarkedAlt,
  FaTreasure,
  FaCoins
} from "react-icons/fa";
import { GiPirateFlag, GiTreasureMap, GiPirateCaptain, GiIsland, GiSailboat } from "react-icons/gi";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newClient, setNewClient] = useState({
    nom: "",
    email: "",
    motDePasse: "",
    role: "client",
    referralCode: ""
  });
  const [currentEditUser, setCurrentEditUser] = useState(null);

  const getExplorerRank = (points) => {
    if (points >= 1000) return { rank: "🏴‍☠️ Capitaine Légendaire", color: "text-purple-600", bg: "bg-purple-100" };
    if (points >= 500) return { rank: "⚓ Capitaine Expérimenté", color: "text-blue-600", bg: "bg-blue-100" };
    if (points >= 200) return { rank: "🗺️ Navigateur Confirmé", color: "text-green-600", bg: "bg-green-100" };
    if (points >= 100) return { rank: "🧭 Explorateur Aguerri", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (points >= 50) return { rank: "⛵ Marin Débutant", color: "text-orange-600", bg: "bg-orange-100" };
    return { rank: "🏝️ Novice", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error("🏴‍☠️ Token du capitaine manquant");

      const response = await fetch("http://localhost:5000/api/users/clients/list", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("🔐 Authentification du capitaine requise");
        if (response.status === 403) throw new Error("⚔️ Permissions insuffisantes, Capitaine");
        throw new Error(`🌊 Erreur en mer: ${response.status}`);
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${clientId}/toggle-active`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) throw new Error("🌊 Échec de la manœuvre");
      
      setClients(clients.map(c => 
        c._id === clientId ? { ...c, isActive: !c.isActive } : c
      ));
    } catch (err) {
      setError(err.message);
      fetchClients();
    }
  };

  const deleteClient = async (clientId) => {
    if (!confirm("🏴‍☠️ Capitaine, êtes-vous sûr de vouloir bannir définitivement cet explorateur des Sept Mers ?")) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${clientId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error("⚔️ Échec du bannissement");

      setClients(clients.filter(c => c._id !== clientId));
    } catch (err) {
      setError(err.message);
    }
  };

  const createClient = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/users/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...newClient,
          isActive: true,
          role: "client"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "🌊 Erreur lors du recrutement");
      }

      const data = await response.json();
      setClients([...clients, data.user]);
      setShowCreateModal(false);
      setNewClient({
        nom: "",
        email: "",
        motDePasse: "",
        role: "client",
        referralCode: ""
      });
    } catch (err) {
      setError(err.message);
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
            isActive: currentEditUser.isActive,
            loyaltyPoints: currentEditUser.loyaltyPoints
          })
        }
      );

      if (!response.ok) throw new Error("🌊 Échec de la modification");
      
      fetchClients();
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (client) => {
    setCurrentEditUser({
      ...client,
      motDePasse: ""
    });
    setShowEditModal(true);
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900 p-4">
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-lg shadow-xl p-6 mb-6 border-4 border-amber-400">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <GiPirateCaptain className="text-4xl text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  🏴‍☠️ Registre des Explorateurs
                </h1>
                <p className="text-amber-100 text-sm">
                  📊 {filteredClients.length} explorateurs dans votre flotte, Capitaine
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCompass className="text-amber-300" />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Rechercher explorateurs..."
                  className="pl-10 pr-4 py-2 bg-white border-2 border-amber-300 rounded-lg w-full placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus /> 🚢 Recruter Explorateur
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => {
            const rank = getExplorerRank(client.loyaltyPoints || 0);
            return (
              <div key={client._id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-amber-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <GiIsland className="text-2xl text-amber-600" />
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{client.nom}</h3>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        📧 {client.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {client.isActive ? '⚓ En mer' : '🏝️ Au port'}
                  </span>
                </div>

                <div className={`${rank.bg} ${rank.color} px-3 py-2 rounded-lg mb-4 text-center font-semibold`}>
                  {rank.rank}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gradient-to-r from-yellow-100 to-amber-100 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <FaCoins className="text-yellow-600" /> Pièces d'Or:
                    </span>
                    <span className="font-bold text-lg text-yellow-700">
                      {client.loyaltyPoints || 0} 🪙
                    </span>
                  </div>
                  
                  {client.referralCode && (
                    <div className="flex items-center justify-between bg-purple-100 p-3 rounded-lg">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        <GiTreasureMap className="text-purple-600" /> Code Parrainage:
                      </span>
                      <span className="font-mono text-purple-700">{client.referralCode}</span>
                    </div>
                  )}
                  
                  {client.lastLogin && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FaAnchor className="text-gray-400" />
                      Dernier accostage: {new Date(client.lastLogin).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => router.push(`/admin/client-history/${client._id}`)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    title="📜 Journal d'Aventures"
                  >
                    <FaHistory />
                  </button>
                  <button
                    onClick={() => router.push(`/admin/users/${client._id}`)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    title="🔍 Inspecter Explorateur"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openEditModal(client)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    title="📝 Modifier Fiche"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => toggleClientStatus(client._id)}
                    className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                      client.isActive 
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } text-white`}
                    title={client.isActive ? '🏝️ Mettre au port' : '⚓ Envoyer en mer'}
                  >
                    <FaPowerOff />
                  </button>
                  <button
                    onClick={() => deleteClient(client._id)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    title="🏴‍☠️ Bannir des Sept Mers"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-2xl w-full max-w-md border-4 border-amber-400">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <GiSailboat className="text-3xl text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-800">🚢 Recruter un Nouveau Explorateur</h2>
                </div>
                
                <form onSubmit={createClient}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <FaUsers className="text-amber-600" /> Nom du Capitaine
                      </label>
                      <input
                        type="text"
                        value={newClient.nom}
                        onChange={(e) => setNewClient({...newClient, nom: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        required
                        placeholder="Nom complet"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        📧 Adresse du Messager
                      </label>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        required
                        placeholder="email@exemple.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        🔐 Mot de Passe Secret
                      </label>
                      <input
                        type="password"
                        value={newClient.motDePasse}
                        onChange={(e) => setNewClient({...newClient, motDePasse: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        required
                        minLength="6"
                        placeholder="Minimum 6 caractères"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <GiTreasureMap className="text-purple-600" /> Code Parrainage (optionnel)
                      </label>
                      <input
                        type="text"
                        value={newClient.referralCode}
                        onChange={(e) => setNewClient({...newClient, referralCode: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        placeholder="Code de parrainage"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-300"
                    >
                      ⚓ Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      🚢 Recruter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditModal && currentEditUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-2xl w-full max-w-md border-4 border-amber-400">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaEdit className="text-3xl text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-800">📝 Modifier la Fiche d'Explorateur</h2>
                </div>
                
                <form onSubmit={handleEditSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <FaUsers className="text-amber-600" /> Nom du Capitaine
                      </label>
                      <input
                        type="text"
                        value={currentEditUser.nom}
                        onChange={(e) => setCurrentEditUser({...currentEditUser, nom: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        📧 Adresse du Messager
                      </label>
                      <input
                        type="email"
                        value={currentEditUser.email}
                        onChange={(e) => setCurrentEditUser({...currentEditUser, email: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        🔐 Nouveau Mot de Passe Secret
                      </label>
                      <input
                        type="password"
                        value={currentEditUser.motDePasse}
                        onChange={(e) => setCurrentEditUser({...currentEditUser, motDePasse: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        placeholder="Laisser vide pour conserver l'actuel"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <FaCoins className="text-yellow-600" /> Pièces d'Or
                      </label>
                      <input
                        type="number"
                        value={currentEditUser.loyaltyPoints || 0}
                        onChange={(e) => setCurrentEditUser({...currentEditUser, loyaltyPoints: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center bg-amber-100 p-3 rounded-lg">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={currentEditUser.isActive}
                        onChange={(e) => setCurrentEditUser({...currentEditUser, isActive: e.target.checked})}
                        className="mr-3 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaAnchor className="text-amber-600" /> Explorateur en mer (actif)
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-300"
                    >
                      ⚓ Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      💾 Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 rounded-xl shadow-lg">
              <FaSync className="animate-spin text-3xl text-amber-600 mx-auto mb-2" />
              <span className="text-amber-800 font-medium">🌊 Navigation en cours...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <FaExclamationCircle className="mr-2 text-xl" />
              <span className="font-medium">🌪️ {error}</span>
            </div>
          </div>
        )}

        {filteredClients.length === 0 && clients.length > 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-8 rounded-xl shadow-lg">
              <FaCompass className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                🔍 Aucun explorateur trouvé pour "<span className="font-semibold">{searchTerm}</span>"
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Essayez un autre terme de recherche, Capitaine
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}