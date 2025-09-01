"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";

export default function OrderHistory() {
  const router = useRouter();
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null); // Nouvel état pour la commande sélectionnée

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const merchantId = user?.merchantId || localStorage.getItem("merchantId") || "zara";

        if (!merchantId) {
          throw new Error("Aucun merchantId trouvé. Veuillez vous reconnecter.");
        }

        const response = await fetch(
          `http://localhost:5000/api/merchant/order-history?merchantId=${merchantId}&userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors de la récupération de l’historique");
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Erreur:", err);
        setError(`❌ Impossible de charger l’historique : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, user]);

  const handleClose = () => {
    router.push("/merchant-dashboard");
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order); // Sélectionne la commande cliquée
  };

  const getLast6MonthsData = () => {
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      months.push(date.toLocaleString("fr-FR", { month: "long", year: "numeric" }));
    }
    return months;
  };

  const getOrderHistoryData = () => {
    if (!selectedOrder) return [];
    const history = new Array(6).fill(0); // Initialise avec 6 mois de données
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = 5 - (Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24 * 30)) % 6);
      if (monthIndex >= 0 && monthIndex < 6) {
        history[monthIndex] += order.totalAmount || 0; // Cumule les montants (ou autre métrique)
      }
    });
    return history;
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Historique des Commandes de {userId}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p>Aucune commande trouvée pour cet utilisateur dans votre boutique.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Order ID</th>
              <th className="p-2">Date</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Points</th>
              <th className="p-2">Articles</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id}
                className="border-t cursor-pointer hover:bg-gray-100"
                onClick={() => handleOrderClick(order)}
              >
                <td className="p-2">{order._id}</td>
                <td className="p-2">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="p-2">{order.totalAmount} €</td>
                <td className="p-2">{order.loyaltyPoints}</td>
                <td className="p-2">
                  {order.items.map((item) => (
                    <div key={item.productId}>
                      {item.quantity}x {item.category} - {item.price} €
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedOrder && (
        <div className="bg-white p-4 rounded-md shadow-md mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Évolution des commandes pour l'order {selectedOrder._id}
          </h3>
          <div className="h-64">
            {/* Ici, tu peux intégrer un composant de graphique (ex. Chart.js) */}
            <Line
              data={{
                labels: getLast6MonthsData(),
                datasets: [
                  {
                    label: "Montant total (€)",
                    data: getOrderHistoryData(),
                    fill: false,
                    borderColor: "#36A2EB",
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Évolution des montants sur 6 mois",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Montant (€)" },
                  },
                  x: { title: { display: true, text: "Mois" } },
                },
              }}
            />
          </div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Fermer
          </button>
        </div>
      )}

      <button
        onClick={handleClose}
        className="mt-6 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Fermer
      </button>
    </div>
  );
}