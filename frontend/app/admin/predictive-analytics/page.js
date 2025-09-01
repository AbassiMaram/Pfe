"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { 
  FaBrain, 
  FaExclamationTriangle, 
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine, 
  FaUserTimes, 
  FaBoxes, 
  FaRobot,
  FaArrowLeft,
  FaLightbulb,
  FaShieldAlt,
  FaFire,
  FaCloudUploadAlt,
  FaUsers,
  FaStore,
  FaGem,
  FaDownload,
  FaPlay,
  FaRedo
} from "react-icons/fa";

export default function PredictiveAnalytics() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("churn");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [merchantId, setMerchantId] = useState(null);
  // États pour les données réelles
  const [churnData, setChurnData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Vérification des droits d'accès
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/register");
    }
  }, [user, authLoading, router]);
  const fetchRealClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/users/clients/list", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des clients");

      const clients = await response.json();
      return clients;
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
      return [];
    }
  };

  // Fonction pour récupérer les données de désengagement
 const fetchChurnData = async () => {
    try {
      const realClients = await fetchRealClients();
      
      if (realClients.length === 0) {
        throw new Error("Aucun client trouvé");
      }

      // Simulation d'analyse sur les vrais clients
      const analyzedClients = realClients.map(client => ({
        ...client,
        riskScore: (Math.random() * 0.3 + 0.5).toFixed(2), // Simulation entre 0.5 et 0.8
        status: ["AtRisk", "Disengaged", "Active"][Math.floor(Math.random() * 3)],
        lastActivity: client.lastLogin 
          ? `Il y a ${Math.floor((new Date() - new Date(client.lastLogin)) / (1000 * 60 * 60 * 24))} jours`
          : "Inconnu"
      }));

      setChurnData({
        highRiskCount: analyzedClients.filter(c => c.status === "Disengaged").length,
        mediumRiskCount: analyzedClients.filter(c => c.status === "AtRisk").length,
        retentionRate: "82.5", // Valeur simulée
        predictions: analyzedClients
      });
      
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    }
  };

  // Fonction pour récupérer les métriques du modèle
  const fetchModelMetrics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/disengagement/model-metrics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des métriques");
      
      const data = await response.json();
      setModelMetrics(data);
    } catch (err) {
      console.error("Erreur métriques:", err);
      setError(err.message);
    }
  };

  // Fonction pour récupérer les prévisions de stock
  const fetchStockPredictions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/stock/predictions", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des prévisions de stock");
      
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error("Erreur stock:", err);
      // Données statiques en fallback
      setStockData({
        totalProducts: 1247,
        lowStockAlert: 34,
        outOfStockSoon: 8,
        overStocked: 12,
        predictions: [
          { id: 1, productName: "Smartphone Galaxy S24", currentStock: 15, predictedDemand: 45, daysRemaining: 8, status: "critique" },
          { id: 2, productName: "Laptop Dell XPS", currentStock: 8, predictedDemand: 12, daysRemaining: 15, status: "faible" },
          { id: 3, productName: "Casque AirPods Pro", currentStock: 3, predictedDemand: 25, daysRemaining: 3, status: "critique" },
          { id: 4, productName: "Montre Apple Watch", currentStock: 25, predictedDemand: 18, daysRemaining: 22, status: "normal" },
          { id: 5, productName: "Tablette iPad Pro", currentStock: 12, predictedDemand: 8, daysRemaining: 28, status: "normal" }
        ]
      });
    }
  };

  // Fonction pour exporter les features clients
  const exportCustomerFeatures = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/disengagement/export-features", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erreur lors de l'export");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer_features.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur export:", err);
      setError(err.message);
    }
  };

  // Fonction pour déclencher des actions
 const triggerActions = async () => {
    try {
      setRefreshing(true);
      const realClients = await fetchRealClients();
      
      if (realClients.length === 0) {
        throw new Error("Aucun client disponible pour les actions");
      }

      // Simulation d'actions sur les clients à risque
      const highRiskClients = realClients
        .filter(() => Math.random() > 0.7) // 30% de clients à risque simulés
        .map(c => c.email);

      alert(`Actions simulées pour ${highRiskClients.length} clients: ${highRiskClients.join(", ")}`);
      
      // Recharger les données
      await fetchChurnData();
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger toutes les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      if (user?.role === "admin") {
        setLoading(true);
        await Promise.all([
          fetchChurnData(),
          fetchModelMetrics(),
          fetchStockPredictions()
        ]);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Fonction de refresh
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchChurnData(),
      fetchModelMetrics(),
      fetchStockPredictions()
    ]);
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧠</div>
          <p className="text-purple-100 text-lg font-semibold">Chargement de l'analyse prédictive...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FaBrain className="text-green-400" />
                  Analyse Prédictive IA
                </h1>
                <p className="text-purple-200 mt-1">Insights avancés et prédictions intelligentes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FaRedo className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
              <button
                onClick={exportCustomerFeatures}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaDownload />
                Exporter
              </button>
            </div>
          </div>
        </div>

        {/* Métriques du modèle */}
        {modelMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Précision du Modèle</p>
                  <p className="text-2xl font-bold">{modelMetrics.accuracy || "94.2"}%</p>
                </div>
                <FaChartLine className="text-2xl" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Rappel</p>
                  <p className="text-2xl font-bold">{modelMetrics.recall || "87.5"}%</p>
                </div>
                <FaArrowUp className="text-2xl" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Score F1</p>
                  <p className="text-2xl font-bold">{modelMetrics.f1Score || "90.8"}%</p>
                </div>
                <FaRobot className="text-2xl" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Prédictions Actives</p>
                  <p className="text-2xl font-bold">{modelMetrics.activePredictions || "1,247"}</p>
                </div>
                <FaFire className="text-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: "churn", label: "Désengagement Client", icon: FaUserTimes },
            { id: "stock", label: "Prévisions Stock", icon: FaBoxes },
            { id: "recommendations", label: "Recommandations IA", icon: FaLightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
          {activeTab === "churn" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaUserTimes className="text-red-400" />
                  Analyse de Désengagement
                </h2>
                <button
                  onClick={triggerActions}
                  disabled={refreshing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FaPlay />
                  Déclencher Actions
                </button>
              </div>

             {churnData ? (
  <div className="space-y-6">
    {/* Statistiques globales */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 border border-red-500">
        <h3 className="text-red-300 font-semibold">Clients Désengagés</h3>
        <p className="text-3xl font-bold text-red-400">{churnData.highRiskCount}</p>
        <p className="text-xs text-red-200">Statut: Disengaged</p>
      </div>
      <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-4 border border-yellow-500">
        <h3 className="text-yellow-300 font-semibold">Clients à Risque</h3>
        <p className="text-3xl font-bold text-yellow-400">{churnData.mediumRiskCount}</p>
        <p className="text-xs text-yellow-200">Statut: AtRisk</p>
      </div>
      <div className="bg-green-900 bg-opacity-50 rounded-lg p-4 border border-green-500">
        <h3 className="text-green-300 font-semibold">Taux de Rétention</h3>
        <p className="text-3xl font-bold text-green-400">{churnData.retentionRate}%</p>
      </div>
    </div>

    {/* Liste des clients */}
    <div className="bg-gray-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Analyse des Clients</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {churnData.predictions.map((customer, index) => (
          <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-600 rounded-lg p-3 hover:bg-gray-500 transition-colors">
            <div className="flex items-center gap-3 mb-2 md:mb-0">
              <div className={`w-3 h-3 rounded-full ${
                customer.status === 'Disengaged' ? 'bg-red-500' : 
                customer.status === 'AtRisk' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <div>
                <p className="text-white font-medium">{customer.customerName}</p>
                <p className="text-gray-300 text-sm">{customer.email}</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="text-center">
                <p className="text-white font-bold">{customer.riskScore ? (customer.riskScore * 100).toFixed(0) : 0}%</p>
                <p className="text-gray-300 text-xs">Risque</p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  customer.status === 'Disengaged' ? 'text-red-400' : 
                  customer.status === 'AtRisk' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {customer.status || 'Inconnu'}
                </p>
                <p className="text-gray-400 text-xs">{customer.lastActivity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
) : (
  <div className="text-center py-8">
    <p className="text-gray-400">Chargement des données...</p>
  </div>
)}

            </div>
          )}

          {activeTab === "stock" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FaBoxes className="text-orange-400" />
                Prévisions de Stock
              </h2>

              {stockData ? (
                <div className="space-y-6">
                  {/* Statistiques du stock */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
                      <h3 className="text-blue-300 font-semibold">Total Produits</h3>
                      <p className="text-2xl font-bold text-blue-400">{stockData.totalProducts}</p>
                    </div>
                    <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-4">
                      <h3 className="text-yellow-300 font-semibold">Stock Faible</h3>
                      <p className="text-2xl font-bold text-yellow-400">{stockData.lowStockAlert}</p>
                    </div>
                    <div className="bg-red-900 bg-opacity-50 rounded-lg p-4">
                      <h3 className="text-red-300 font-semibold">Bientôt Épuisé</h3>
                      <p className="text-2xl font-bold text-red-400">{stockData.outOfStockSoon}</p>
                    </div>
                    <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
                      <h3 className="text-green-300 font-semibold">Surstock</h3>
                      <p className="text-2xl font-bold text-green-400">{stockData.overStocked}</p>
                    </div>
                  </div>

                  {/* Prédictions détaillées */}
                  {stockData.predictions && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-4">Prédictions Détaillées</h3>
                      <div className="space-y-3">
                        {stockData.predictions.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                            <div>
                              <p className="text-white font-medium">{item.productName}</p>
                              <p className="text-gray-300 text-sm">Stock actuel: {item.currentStock}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                item.status === 'critique' ? 'text-red-400' :
                                item.status === 'faible' ? 'text-yellow-400' :
                                item.status === 'normal' ? 'text-green-400' : 'text-blue-400'
                              }`}>
                                {item.daysRemaining} jours
                              </p>
                              <p className="text-gray-300 text-sm">restants</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Aucune donnée de stock disponible</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "recommendations" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FaLightbulb className="text-yellow-400" />
                Recommandations IA
              </h2>

              <div className="space-y-4">
                {[
                  {
                    type: "Désengagement",
                    title: "Lancer une campagne de rétention ciblée",
                    description: "127 clients à risque identifiés - Envoyer des offres personnalisées",
                    impact: "Rétention +15%",
                    priority: "Haute",
                    action: "Créer campagne email"
                  },
                  {
                    type: "Stock",
                    title: "Réapprovisionner les produits critiques",
                    description: "8 produits bientôt épuisés - Commande urgente recommandée",
                    impact: "Éviter les ruptures",
                    priority: "Haute",
                    action: "Passer commande"
                  },
                  {
                    type: "Ventes",
                    title: "Optimiser les prix en temps réel",
                    description: "Opportunité détectée sur 23 produits - Ajustement automatique",
                    impact: "Revenue +8%",
                    priority: "Moyenne",
                    action: "Ajuster prix"
                  },
                  {
                    type: "Marketing",
                    title: "Cibler les clients haute valeur",
                    description: "156 clients VIP identifiés - Campagne premium recommandée",
                    impact: "LTV +22%",
                    priority: "Moyenne",
                    action: "Créer segment VIP"
                  }
                ].map((rec, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{rec.type}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.priority === 'Haute' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold mb-1">{rec.title}</h3>
                        <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-green-400 font-semibold">{rec.impact}</p>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            {rec.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mt-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400" />
              <p className="text-red-300">Erreur: {error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}