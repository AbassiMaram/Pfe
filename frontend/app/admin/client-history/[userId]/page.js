"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FaArrowLeft,
  FaShip,
  FaCoins,
  FaCompass,
  FaMap,
  FaBoxOpen, // Remplacement de FaTreasureChest
  FaAnchor,
  FaSkull,
  FaGem,
  FaBinoculars, // Remplacement de FaSpyglass
  FaFlag
} from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminClientHistory() {
  const router = useRouter();
  const { userId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientInfo, setClientInfo] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const clientResponse = await fetch(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!clientResponse.ok) throw new Error("Erreur chargement de l'explorateur");
        const clientData = await clientResponse.json();
        setClientInfo(clientData);

        const historyResponse = await fetch(
          `http://localhost:5000/api/users/admin/client-orders/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!historyResponse.ok) throw new Error("Erreur chargement du journal de bord");
        const historyData = await historyResponse.json();
        setOrders(historyData.orders || []);
      } catch (err) {
        console.error("Erreur:", err);
        setError(`⚠️ Tempête en mer : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const getMerchants = () => {
    const merchants = {};
    orders.forEach(order => {
      if (!merchants[order.merchantId]) {
        merchants[order.merchantId] = {
          totalAmount: 0,
          totalPoints: 0,
          orders: []
        };
      }
      merchants[order.merchantId].totalAmount += order.totalAmount;
      merchants[order.merchantId].totalPoints += order.loyaltyPoints;
      merchants[order.merchantId].orders.push(order);
    });
    return merchants;
  };

  const getLast6MonthsData = (merchantId) => {
    const months = Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
        amount: 0,
        points: 0
      };
    });

    if (merchantId) {
      orders.forEach(order => {
        if (order.merchantId === merchantId) {
          const orderDate = new Date(order.createdAt);
          const orderMonth = orderDate.getMonth();
          const orderYear = orderDate.getFullYear();
          
          const monthIndex = months.findIndex(m => {
            const [monthStr, yearStr] = m.month.split(' ');
            const monthNum = new Date(`${monthStr} 1 ${yearStr}`).getMonth();
            const yearNum = parseInt(yearStr);
            return monthNum === orderMonth && yearNum === orderYear;
          });

          if (monthIndex !== -1) {
            months[monthIndex].amount += order.totalAmount;
            months[monthIndex].points += order.loyaltyPoints;
          }
        }
      });
    }

    return months;
  };

  const getExplorerRank = (totalPoints) => {
    if (totalPoints >= 10000) return { rank: "🏴‍☠️ Capitaine Légendaire", color: "text-purple-600" };
    if (totalPoints >= 5000) return { rank: "⚓ Amiral des Mers", color: "text-blue-600" };
    if (totalPoints >= 2000) return { rank: "🗡️ Corsaire Expert", color: "text-red-600" };
    if (totalPoints >= 1000) return { rank: "🏴 Pirate Confirmé", color: "text-orange-600" };
    if (totalPoints >= 500) return { rank: "⚔️ Marin Expérimenté", color: "text-green-600" };
    if (totalPoints >= 100) return { rank: "🌊 Moussaillon Brave", color: "text-teal-600" };
    return { rank: "🚢 Nouveau Marin", color: "text-gray-600" };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400"></div>
            <p className="text-white mt-4 text-lg">🌊 Navigation en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = orders.reduce((sum, order) => sum + order.loyaltyPoints, 0);
  const explorerRank = getExplorerRank(totalPoints);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900">
      <div className="container mx-auto p-6">
        <button
          onClick={() => router.push('/admin/users/clients')}
          className="mb-6 flex items-center text-yellow-300 hover:text-yellow-100 transition-colors bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm"
        >
          <FaArrowLeft className="mr-2" /> 🏴‍☠️ Retour au Port Principal
        </button>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-yellow-400/30">
          <h1 className="text-3xl font-bold mb-2 text-yellow-300 flex items-center">
            <FaBinoculars className="mr-3" />
            Journal de Bord - Explorateur {clientInfo?.nom || 'Inconnu'}
          </h1>
          <p className="text-blue-200 mb-2">{clientInfo?.email}</p>
          <div className="flex items-center">
            <FaSkull className="mr-2 text-yellow-400" />
            <span className={`font-bold ${explorerRank.color}`}>
              Rang: {explorerRank.rank}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg backdrop-blur-sm">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-yellow-900/50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg backdrop-blur-sm">
            <p className="text-yellow-200">🌊 Cet explorateur n'a encore trouvé aucun trésor dans nos îles.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-yellow-400/30">
                <h3 className="font-semibold flex items-center text-yellow-300 mb-3">
                  <FaMap className="mr-2" /> Îles Explorées
                </h3>
                <p className="text-3xl font-bold text-white">
                  {Object.keys(getMerchants()).length}
                </p>
                <p className="text-blue-200 text-sm">🏝️ Territoires découverts</p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-yellow-400/30">
                <h3 className="font-semibold flex items-center text-yellow-300 mb-3">
                  <FaBoxOpen className="mr-2" /> Trésor Accumulé
                </h3>
                <p className="text-3xl font-bold text-white">
                  {orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)} €
                </p>
                <p className="text-blue-200 text-sm">💰 Valeur totale des trésors</p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-yellow-400/30">
                <h3 className="font-semibold flex items-center text-yellow-300 mb-3">
                  <FaCoins className="mr-2" /> Pièces d'Or
                </h3>
                <p className="text-3xl font-bold text-white">
                  {totalPoints}
                </p>
                <p className="text-blue-200 text-sm">🪙 Points de fidélité collectés</p>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 border border-yellow-400/30">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-yellow-300">
                <FaCompass className="mr-3" /> Expéditions par Île
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-yellow-400/30">
                      <th className="text-left p-4 text-yellow-300">🏝️ Île (Boutique)</th>
                      <th className="text-left p-4 text-yellow-300">⚓ Expéditions</th>
                      <th className="text-left p-4 text-yellow-300">💰 Trésor Total</th>
                      <th className="text-left p-4 text-yellow-300">🪙 Pièces d'Or</th>
                      <th className="text-left p-4 text-yellow-300">🔍 Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getMerchants()).map(([merchantId, data]) => (
                      <tr key={merchantId} className="border-b border-blue-400/20 hover:bg-blue-900/30 transition-colors">
                        <td className="p-4 flex items-center">
                          <FaShip className="mr-2 text-blue-400" />
                          {merchantId}
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-600/30 px-3 py-1 rounded-full text-sm">
                            {data.orders.length}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-yellow-300">
                          {data.totalAmount.toFixed(2)} €
                        </td>
                        <td className="p-4 font-semibold text-yellow-400">
                          <FaCoins className="inline mr-1" />
                          {data.totalPoints}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedMerchant(merchantId === selectedMerchant ? null : merchantId)}
                            className="text-yellow-300 hover:text-yellow-100 transition-colors bg-blue-600/20 px-3 py-1 rounded-lg"
                          >
                            {merchantId === selectedMerchant ? (
                              <>
                                <FaFlag className="inline mr-1" />
                                Replier la Carte
                              </>
                            ) : (
                              <>
                                <FaBinoculars className="inline mr-1" />
                                Explorer l'Île
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedMerchant && (
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 border border-yellow-400/30">
                <h3 className="text-xl font-bold mb-6 text-yellow-300 flex items-center">
                  <FaAnchor className="mr-2" />
                  📜 Chronique des Expéditions - Île {selectedMerchant}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4 text-blue-200 flex items-center">
                      <FaGem className="mr-2" />
                      Dernières Découvertes
                    </h4>
                    <div className="max-h-80 overflow-y-auto space-y-4">
                      {getMerchants()[selectedMerchant].orders
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map(order => (
                          <div key={order._id} className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <FaFlag className="mr-2 text-yellow-400" />
                              <p className="font-medium text-white">
                                {new Date(order.createdAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="text-yellow-300">
                                💰 Trésor: {order.totalAmount.toFixed(2)} €
                              </p>
                              <p className="text-yellow-400">
                                🪙 Pièces d'or: {order.loyaltyPoints}
                              </p>
                              <p className="text-blue-200">
                                📦 Butin: {order.items.map(i => `${i.quantity}x ${i.name || 'Artefact mystérieux'}`).join(', ')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4 text-blue-200 flex items-center">
                      <FaBoxOpen className="mr-2" />
                      Résumé du Trésor
                    </h4>
                    <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-200">🏴‍☠️ Expéditions totales:</span>
                          <span className="text-white font-bold">
                            {getMerchants()[selectedMerchant].orders.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">💰 Trésor accumulé:</span>
                          <span className="text-yellow-300 font-bold">
                            {getMerchants()[selectedMerchant].totalAmount.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">🪙 Pièces d'or:</span>
                          <span className="text-yellow-400 font-bold">
                            {getMerchants()[selectedMerchant].totalPoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">📊 Moyenne par expédition:</span>
                          <span className="text-white font-bold">
                            {(getMerchants()[selectedMerchant].totalAmount / getMerchants()[selectedMerchant].orders.length).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}