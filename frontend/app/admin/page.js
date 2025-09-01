"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { 
  FaAnchor, 
  FaUsers, 
  FaShip, 
  FaChartLine, 
  FaCog, 
  FaSignOutAlt, 
  FaCoins, 
  FaMap, 
  FaTrophy,  
  FaCompass, 
  FaShield,
  FaBinoculars,
  FaCrown,
  FaStar,
  FaGem,
  FaEye,
  FaFlag
} from "react-icons/fa";

export default function AdminPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMerchants: 0,
    totalOrders: 0,
    revenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);

  // Vérification des droits d'accès
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/register");
    }
  }, [user, authLoading, router]);

  // Nouvelle version optimisée de fetchStats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token manquant");

      const response = await fetch("http://localhost:5000/api/users/dashboard/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");

      const data = await response.json();

      setStats({
        totalUsers: data.stats.users.active,
        totalMerchants: data.stats.merchants.total,
        totalOrders: data.stats.orders.total,
        revenue: data.stats.revenue.total
      });

      setRecentActivities([
        {
          title: "Nouveaux Explorateurs",
          description: `${data.stats.users.recent} nouveaux aventuriers (24h)`,
          time: new Date().toLocaleTimeString(),
          icon: "🧭"
        },
        {
          title: "Équipage Actif",
          description: `${data.stats.merchants.active} membres d'équipage actifs`,
          time: new Date().toLocaleTimeString(),
          icon: "⚓"
        },
        {
          title: "Expéditions Terminées",
          description: `${data.stats.orders.total} expéditions réussies`,
          time: new Date().toLocaleTimeString(),
          icon: "🏆"
        }
      ]);
      
    } catch (err) {
      console.error("Erreur fetchStats:", err);
      setError(err.message || "Erreur réseau");
    } finally {
      setLoadingStats(false);
    }
  };

  // Charger les statistiques
  useEffect(() => {
    if (user?.role === "admin") fetchStats();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/register");
  };

  if (authLoading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-teal-900 p-4">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧭</div>
          <p className="text-blue-100 text-lg font-semibold">Navigation en cours...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-teal-900 p-4 relative overflow-hidden">
      {/* Background décoratif maritime */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🧭</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">⚓</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🏴‍☠️</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce">🗺️</div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header du Capitaine */}
        <div className="bg-gradient-to-r from-blue-800 via-slate-700 to-teal-800 rounded-xl p-6 mb-6 shadow-2xl border-2 border-blue-600 relative">
          <div className="absolute top-2 right-2 text-2xl animate-pulse">🧭</div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaCrown className="text-yellow-400 animate-pulse" />
                Pont de Commandement
                <FaFlag className="text-red-400 ml-2" />
              </h1>
              <p className="text-blue-200 mt-2 flex items-center gap-2">
                <FaAnchor className="text-yellow-300" />
                Capitaine <span className="font-semibold text-yellow-300">{user.nom}</span>
                <span className="text-blue-300">- En service</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
            >
              <FaSignOutAlt /> Quitter le Pont
            </button>
          </div>
        </div>

        {/* Statistiques de la Flotte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { 
              icon: <FaUsers className="text-3xl text-blue-200" />,
              title: "Explorateurs Actifs",
              value: stats.totalUsers,
              colors: "from-blue-500 to-cyan-600",
              decoration: "🧭"
            },
            { 
              icon: <FaShip className="text-3xl text-teal-200" />,
              title: "Navires de l'Équipage",
              value: stats.totalMerchants,
              colors: "from-teal-500 to-emerald-600",
              decoration: "⚓"
            },
            { 
              icon: <FaTrophy className="text-3xl text-amber-200" />,
              title: "Expéditions Réussies",
              value: stats.totalOrders,
              colors: "from-amber-500 to-orange-600",
              decoration: "🏆"
            },
            { 
              icon: <FaCoins className="text-3xl text-yellow-200" />,
              title: "Trésor de la Flotte",
              value: `${stats.revenue.toLocaleString()} TND`,
              colors: "from-yellow-500 to-orange-600",
              decoration: "💰"
            }
          ].map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.colors} rounded-xl p-6 text-white shadow-xl transition-all hover:scale-105 relative`}>
              <div className="absolute top-2 right-2 text-lg animate-pulse">{stat.decoration}</div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 shadow-2xl border-2 border-slate-600 relative">
            <div className="absolute top-4 right-4 text-2xl animate-pulse">🗺️</div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaCompass className="text-blue-400 animate-spin" />
              Commandes du Capitaine
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: <FaUsers className="text-xl" />,
                  title: "Gérer les Explorateurs",
                  description: "Superviser les aventuriers",
                  action: () => router.push("/admin/users/clients"),
                  colors: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
                  decoration: "🧭"
                },
                {
                  icon: <FaShip className="text-xl" />,
                  title: "Gérer l'Équipage",
                  description: "Administrer les membres",
                  action: () => router.push("/admin/users/merchants"),
                  colors: "from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700",
                  decoration: "⚓"
                },
                {
                  icon: <FaCompass className="text-xl" />,
                  title: "Gérer les Navires",
                  description: "Superviser la flotte",
                  action: () => router.push("/admin/shops"),
                  colors: "from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700",
                  decoration: "🚢"
                },
                {
                  icon: <FaChartLine className="text-xl" />,
                  title: "Cartes de Navigation",
                  description: "Rapports et analyses",
                  action: () => router.push("/admin/reports"),
                  colors: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                  decoration: "📊"
                },
                {
                  icon: <FaBinoculars className="text-xl" />,
                  title: "Prédictions Marines",
                  description: "IA et analyse prédictive",
                  action: () => router.push("/admin/predictive-analytics"),
                  colors: "from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700",
                  decoration: "🔮"
                },
                {
                  icon: <FaCog className="text-xl" />,
                  title: "Paramètres du Navire",
                  description: "Configuration système",
                  action: () => router.push("/admin/settings"),
                  colors: "from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
                  decoration: "⚙️"
                }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className={`bg-gradient-to-r ${item.colors} text-white p-4 rounded-lg transition-all hover:scale-105 flex items-center gap-3 relative shadow-lg`}
                >
                  <div className="absolute top-1 right-1 text-sm opacity-70">{item.decoration}</div>
                  {item.icon}
                  <div className="text-left">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm opacity-80">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Journal du Capitaine */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border-2 border-slate-600 relative">
            <div className="absolute top-4 right-4 text-2xl animate-pulse">📖</div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaMap className="text-teal-400" />
              Journal du Capitaine
            </h2>

            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-700 rounded-lg p-4 border-l-4 border-teal-500 relative"
                  >
                    <div className="absolute top-2 right-2 text-lg">{activity.icon}</div>
                    <p className="text-teal-400 font-semibold text-sm">{activity.title}</p>
                    <p className="text-slate-300 text-sm">{activity.description}</p>
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <FaEye className="text-xs" />
                      {activity.time}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🌊</div>
                  <p className="text-slate-300">Eaux calmes...</p>
                  <p className="text-slate-500 text-sm">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Maritime */}
        <div className="mt-8 text-center bg-slate-800 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaAnchor className="text-blue-400" />
            <FaShip className="text-teal-400" />
            <FaCrown className="text-yellow-400" />
          </div>
          <p className="text-blue-300 text-sm">
            © 2024 LoyaltyHub Pro - Flotte Maritime Digitale
          </p>
          <p className="text-slate-400 text-xs mt-1">
            "Que les vents vous soient favorables, Capitaine !"
          </p>
        </div>
      </div>
    </div>
  );
}