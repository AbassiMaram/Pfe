"use client";

import { useState, useEffect } from "react";
import {
  FaFileCsv,
  FaFilter,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaStore,
  FaUsers,
  FaShoppingCart,
  FaBoxes,
  FaFileExcel,
  FaFilePdf,
  FaCompass,
  FaMap,
  FaCoins,
  FaGem,
  FaBoxOpen, // Remplacement de FaChest
  FaShip,
  FaAnchor,
  FaBinoculars // Remplacement de FaSpyglass
} from "react-icons/fa";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function CaptainAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("revenue");

  // Données des graphiques
  const [chartData, setChartData] = useState({
    revenue: { labels: [], datasets: [] },
    customers: { labels: [], datasets: [] },
    merchants: { labels: [], datasets: [] },
    shops: { labels: [], datasets: [] },
    products: { labels: [], datasets: [] },
  });

  // Récupération des données depuis l'API
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("🏴‍☠️ Capitaine, veuillez vous identifier");

      const res = await fetch('http://localhost:5000/api/order/analytics?range=month', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const responseText = await res.text();
      
      if (!res.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || "Tempête dans les données !");
        } catch {
          throw new Error(responseText || "Problème dans l'expédition");
        }
      }

      const data = JSON.parse(responseText);
      
      if (!data.success) {
        throw new Error(data.message || "Carte corrompue, impossible de naviguer");
      }

      const { revenueData, customersData, topMerchants, ordersByShop, topProducts } = data.data;

      // Formater les données pour les graphiques avec thème trésor
      setChartData({
        revenue: {
          labels: revenueData.map((item) => item.date),
          datasets: [
            {
              label: "Trésor Collecté (pièces d'or)",
              data: revenueData.map((item) => item.total),
              borderColor: "#D97706",
              backgroundColor: "rgba(217, 119, 6, 0.2)",
              tension: 0.1,
              borderWidth: 3,
            },
          ],
        },
        customers: {
          labels: customersData.map((item) => item.date),
          datasets: [
            {
              label: "Nouveaux Explorateurs",
              data: customersData.map((item) => item.count),
              backgroundColor: "#059669",
              borderColor: "#10B981",
              borderWidth: 2,
            },
          ],
        },
        merchants: {
          labels: topMerchants.map((item) => item.merchantName),
          datasets: [
            {
              label: "Trésors Rapportés (pièces d'or)",
              data: topMerchants.map((item) => item.totalSales),
              backgroundColor: [
                "#D97706",
                "#B45309",
                "#92400E",
                "#78350F",
                "#451A03"
              ],
              borderColor: "#92400E",
              borderWidth: 2,
            },
          ],
        },
        shops: {
          labels: ordersByShop.map((item) => item.shopName),
          datasets: [
            {
              data: ordersByShop.map((item) => item.count),
              backgroundColor: [
                "#D97706",
                "#059669",
                "#DC2626",
                "#7C3AED",
                "#EA580C",
                "#0891B2",
                "#65A30D",
                "#6B7280",
                "#BE185D",
                "#7C2D12",
              ],
              borderColor: "#92400E",
              borderWidth: 2,
            },
          ],
        },
        products: {
          labels: topProducts.map((item) => item.productName),
          datasets: [
            {
              label: "Trésors Découverts",
              data: topProducts.map((item) => item.totalQuantity),
              backgroundColor: "#7C3AED",
              borderColor: "#5B21B6",
              borderWidth: 2,
            },
          ],
        },
      });
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Fonction d'export
const handleExport = async (format) => {
  try {
    // 1. Récupération du token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('🛑 Session expirée - Veuillez vous reconnecter');
    }

    // 2. Configuration de la requête
    const apiUrl = `http://localhost:5000/api/order/export?format=${format}`;
    const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/csv'
      }
    };

    console.log('⚡ Envoi de la requête d\'export...');

    // 3. Exécution de la requête
    const response = await fetch(apiUrl, requestOptions);

    // 4. Gestion des erreurs HTTP
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('🔐 Session expirée - Authentification requise');
    }

    if (response.status === 403) {
      throw new Error('🚫 Accès refusé - Privilèges insuffisants');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '❌ Erreur lors de l\'export');
    }

    // 5. Traitement de la réponse CSV
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // 6. Création du téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_commandes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    
    // 7. Nettoyage
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    // 8. Notification de succès
    console.log('✅ Export réussi !');
    return { success: true, message: 'Export CSV généré avec succès' };

  } catch (error) {
    console.error('🔥 Erreur lors de l\'export:', error);
    
    // Gestion des erreurs spécifiques
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = '🌐 Erreur réseau - Vérifiez votre connexion';
    }

    // Retourner l'erreur pour affichage dans l'UI
    return { 
      success: false, 
      message: errorMessage,
      isAuthError: error.message.includes('Authentification') || error.message.includes('Session')
    };
  }
};
  // Configuration des options des graphiques avec thème trésor
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: "top",
        labels: {
          color: "#92400E",
          font: {
            weight: "bold"
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const suffix = activeTab === "revenue" || activeTab === "merchants" ? " pièces d'or" : 
                          activeTab === "customers" ? " explorateurs" : "";
            return `${context.dataset.label}: ${context.raw}${suffix}`;
          },
        },
        backgroundColor: "rgba(146, 64, 14, 0.9)",
        titleColor: "#FEF3C7",
        bodyColor: "#FEF3C7",
        borderColor: "#D97706",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        ticks: {
          color: "#92400E"
        },
        grid: {
          color: "rgba(146, 64, 14, 0.1)"
        }
      },
      x: {
        ticks: {
          color: "#92400E"
        },
        grid: {
          color: "rgba(146, 64, 14, 0.1)"
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* En-tête Capitaine */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 text-white shadow-2xl">
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-4">
            <FaCompass className="text-4xl text-yellow-300 mr-4 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold">🏴‍☠️ Salle des Cartes du Capitaine</h1>
              <p className="text-amber-200 mt-1">Navigation et Analyse des Trésors de la Flotte</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Panneau de contrôle */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 p-6 rounded-xl shadow-lg mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center">
                  <FaBinoculars className="mr-2" />
                  Période d'Exploration
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border-2 border-amber-300 rounded-lg p-3 bg-white text-amber-900 font-semibold"
                  disabled={loading}
                >
                  <option value="week">🗓️ 7 derniers jours</option>
                  <option value="month">📅 30 derniers jours</option>
                  <option value="quarter">📊 3 derniers mois</option>
                  <option value="year">📈 12 derniers mois</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => fetchAnalyticsData()}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-lg border-2 border-amber-700 transition-colors"
                  title="🔍 Actualiser les données"
                >
                  <FaFilter className="text-lg" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors shadow-md"
              >
                <FaFileCsv /> 📜 Parchemin CSV
              </button>
              <button
                disabled
                className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed"
                title="📊 Carte Excel - Bientôt disponible"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                disabled
                className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed"
                title="📋 Rapport PDF - Bientôt disponible"
              >
                <FaFilePdf /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Navigation par onglets thématiques */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-4 mb-6">
          <div className="flex border-b-2 border-amber-300 overflow-x-auto">
            <button
              className={`px-6 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                activeTab === "revenue" 
                  ? "border-b-4 border-amber-600 text-amber-800 bg-amber-200 rounded-t-lg" 
                  : "text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setActiveTab("revenue")}
            >
              <FaCoins className="text-lg" /> 💰 Trésor Principal
            </button>
            <button
              className={`px-6 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                activeTab === "customers" 
                  ? "border-b-4 border-amber-600 text-amber-800 bg-amber-200 rounded-t-lg" 
                  : "text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setActiveTab("customers")}
            >
              <FaUsers className="text-lg" /> 🏴‍☠️ Explorateurs
            </button>
            <button
              className={`px-6 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                activeTab === "merchants" 
                  ? "border-b-4 border-amber-600 text-amber-800 bg-amber-200 rounded-t-lg" 
                  : "text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setActiveTab("merchants")}
            >
              <FaStore className="text-lg" /> 👥 Équipage
            </button>
            <button
              className={`px-6 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                activeTab === "shops" 
                  ? "border-b-4 border-amber-600 text-amber-800 bg-amber-200 rounded-t-lg" 
                  : "text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setActiveTab("shops")}
            >
              <FaShip className="text-lg" /> 🚢 Flotte
            </button>
            <button
              className={`px-6 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                activeTab === "products" 
                  ? "border-b-4 border-amber-600 text-amber-800 bg-amber-200 rounded-t-lg" 
                  : "text-amber-700 hover:bg-amber-50"
              }`}
              onClick={() => setActiveTab("products")}
            >
              <FaGem className="text-lg" /> 💎 Trésors Découverts
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-amber-100 rounded-xl p-8 shadow-lg max-w-md mx-auto">
              <FaCompass className="text-6xl text-amber-600 mx-auto mb-4 animate-spin" />
              <p className="text-xl font-bold text-amber-800">🧭 Navigation en cours...</p>
              <p className="text-amber-700 mt-2">Le capitaine étudie les cartes</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaAnchor className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-bold text-red-800">🚨 Tempête détectée !</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 p-6 rounded-xl shadow-lg">
            {activeTab === "revenue" && (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-800">
                  <FaCoins className="text-yellow-500" />
                  💰 Évolution du Trésor Principal
                </h2>
                <div className="h-96 bg-white rounded-lg p-4 shadow-inner">
                  <Line data={chartData.revenue} options={chartOptions} />
                </div>
              </>
            )}

            {activeTab === "customers" && (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-800">
                  <FaUsers className="text-emerald-500" />
                  🏴‍☠️ Nouveaux Explorateurs Recrutés
                </h2>
                <div className="h-96 bg-white rounded-lg p-4 shadow-inner">
                  <Bar data={chartData.customers} options={chartOptions} />
                </div>
              </>
            )}

            {activeTab === "merchants" && (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-800">
                  <FaStore className="text-amber-500" />
                  👥 Top 5 Membres d'Équipage - Trésors Rapportés
                </h2>
                <div className="h-96 bg-white rounded-lg p-4 shadow-inner">
                  <Bar
                    data={chartData.merchants}
                    options={{
                      ...chartOptions,
                      indexAxis: "y",
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === "shops" && (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-800">
                  <FaShip className="text-blue-500" />
                  🚢 Performance des Navires de la Flotte
                </h2>
                <div className="h-96 bg-white rounded-lg p-4 shadow-inner">
                  <Pie data={chartData.shops} options={chartOptions} />
                </div>
              </>
            )}

            {activeTab === "products" && (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-800">
                  <FaGem className="text-purple-500" />
                  💎 Top 5 Trésors les Plus Convoités
                </h2>
                <div className="h-96 bg-white rounded-lg p-4 shadow-inner">
                  <Bar
                    data={chartData.products}
                    options={{
                      ...chartOptions,
                      indexAxis: "y",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer du Capitaine */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 text-center py-6 mt-12">
        <p className="text-amber-200 text-sm">
          🏴‍☠️ <span className="font-bold text-yellow-300">Capitaine</span> | Maître des Cartes | Gardien du Trésor Principal
        </p>
      </div>
    </div>
  );
}