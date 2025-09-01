"use client";
import React, { useContext, useState, useEffect, useCallback,  useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  FaUsers, FaGift, FaChartLine, FaStar, FaAward, FaEnvelope,
  FaChartBar, FaBox, FaBars, FaBell, FaShoppingCart, FaChartPie,
  FaBullhorn, FaAddressBook, FaWarehouse, FaCloud, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaTimes,  FaMap, FaCoins, FaTrophy, FaStore
} from "react-icons/fa";
import { Bar, Pie, Line, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  LineElement, PointElement, ArcElement, RadarController, RadialLinearScale
} from "chart.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaPaperPlane } from "react-icons/fa";

import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";



const stripePromise = loadStripe("pk_test_51PZC2YCjT7zmyc7u4ijqte1k2ak2KtVSS4l3M8ohpYjvZ4M5e3JAVPRConbXlmMDWcLkh7H9JF0tWzzfLynjBuDr00mNIwipzd");


// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const DemographicMap = ({ demographicData, setMessage }) => {
  console.log("🔍 Debug DemographicMap:");
  console.log("- demographicData:", demographicData);
  console.log("- Type:", typeof demographicData);
  console.log("- Keys:", demographicData ? Object.keys(demographicData) : "N/A");
  console.log("- demographicData.data:", demographicData?.data);
  console.log("- Type de data:", typeof demographicData?.data);
  console.log("- Est array?:", Array.isArray(demographicData?.data));
  console.log("- Longueur:", demographicData?.data?.length);

  const countries = Array.isArray(demographicData) ? demographicData : [];
  console.log("🗺️ Pays à afficher:", countries);

  const validCountries = countries.filter(country => {
    const hasValidCoords =
      country?.coordinates &&
      typeof country.coordinates.lat === 'number' &&
      typeof country.coordinates.lng === 'number' &&
      country.coordinates.lat !== 0 &&
      country.coordinates.lng !== 0;

    if (!hasValidCoords) {
      console.warn("❌ Pays sans coordonnées valides:", country);
    }

    return hasValidCoords;
  });

  console.log("✅ Pays avec coordonnées valides:", validCountries);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Carte des clients par pays</h2>

      {validCountries.length > 0 ? (
        <div>
          <p className="mb-2 text-green-600 font-semibold">
            🗺️ {validCountries.length} pays trouvés avec coordonnées valides
          </p>

          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "400px", width: "100%", border: "2px solid #ccc" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {validCountries.map((country, idx) => (
              <Marker
                key={`${country.country}-${idx}`}
                position={[country.coordinates.lat, country.coordinates.lng]}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{country.country}</h3>
                    {/* Supprimer les détails clients ici pour éviter la répétition */}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Détail par pays:</h3>
            <div className="grid grid-cols-2 gap-2">
              {validCountries.map((country, idx) => (
                <div key={idx} className="p-2 bg-blue-50 rounded">
                  <span className="font-medium">{country.country}</span>: {country.count} clients ({country.percentage}%)
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-red-50 rounded">
          <p className="text-red-600 font-semibold">❌ Aucune donnée à afficher sur la carte</p>
          <p className="text-sm text-gray-600 mt-2">
            Pays reçus: {countries.length} | Pays valides: {validCountries.length}
          </p>
          {countries.length > 0 && (
            <div className="mt-4 text-left">
              <p className="font-medium">Pays reçus mais invalides:</p>
              <ul className="text-sm">
                {countries.map((country, idx) => (
                  <li key={idx}>
                    {country.country}: {country.count} clients
                    {!country.coordinates ? " (❌ pas de coordonnées)" : 
                      (country.coordinates.lat === 0 || country.coordinates.lng === 0) ? " (❌ coordonnées invalides)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  LineElement, PointElement, ArcElement, RadarController, RadialLinearScale
);
const EVENT_IMAGES = {
  "Noël": "/images/No.jpg",
  "Saint-Valentin": "/images/SA.jpg",
  "Black Friday": "/images/F.jpg",
  "Période de Noël 🎄": "/images/No.jpg",
  "Période de Saint-Valentin 💖": "/images/SA.jpg",
  "Période de Black Friday 🛒": "/images/F.jpg",
  "2025-11": "/images/F.jpg", // ← AJOUTEZ CETTE LIGNE !
  "2025-12": "/images/No.jpg",   // ← ET CELLE-CI pour décembre
  "2025-02": "/images/saint.jpg", // ← ET CELLE-CI pour février
  "undefined": "/images/F.jpg",
  "null": "/images/F.jpg"
};
export default function MerchantDashboard() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalPoints: 0, averagePoints: 0 });
  const [loading, setLoading] = useState(true);
  const [pointsToAdd, setPointsToAdd] = useState({ userId: "", points: "" });
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [averageOrderAmounts, setAverageOrderAmounts] = useState({});
  const [loadingAverages, setLoadingAverages] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailData, setCustomerDetailData] = useState(null);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [pointsConfig, setPointsConfig] = useState({ multipliers: {}, enabled: true });
  const [rewards, setRewards] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    type: "", productIds: [], discountValue: "", discountValues: [],
    additionalProducts: 0, specialOffer: { type: "", multiplier: 2, buyProductId: "", getProductId: "", minPoints: 0 },
    startDate: "", endDate: "", customTitle: "", customDescription: "", customTerms: "", customMinPoints: 0,
  });
  const [currentPage, setCurrentPage] = React.useState(1);
const [sentimentFilter, setSentimentFilter] = React.useState(""); // "" pour tous, "positif", "neutre", ou "négatif"
  const [products, setProducts] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showSidebarNotificationMenu, setShowSidebarNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeSection, setActiveSection] = useState("all");
  const [activeSubSection, setActiveSubSection] = useState("ecommerce");
  const [analytics, setAnalytics] = useState({});
  const [stockForm, setStockForm] = useState({ name: "", price: "", category: "", stock: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forecasts, setForecasts] = useState([]);
  const [merchantStats, setMerchantStats] = useState(null);
  const [demographicData, setDemographicData] = useState(null);
  const [compareStartMonth, setCompareStartMonth] = useState("");
  const [compareEndMonth, setCompareEndMonth] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [filters, setFilters] = useState({
    status: "", loyaltyLevel: "", minFrequency: "", lastOrderDate: "",
    minPoints: "", minOrders: "", lastVisit: ""
  });
  const [segmentationType, setSegmentationType] = useState("frequencyVariation");
  const [segmentationThreshold, setSegmentationThreshold] = useState(0);
  const [segments, setSegments] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);
  const [stockHistoryData, setStockHistoryData] = useState([]);
  const [stockHistoryLabels, setStockHistoryLabels] = useState([]);
  const [showEditRewardModal, setShowEditRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [processing, setProcessing] = useState({});
  const [events, setEvents] = useState([
    { id: 1, title: "Event Conf.", date: new Date(2025, 5, 16), color: "danger", startDate: new Date(2025, 5, 16), endDate: new Date(2025, 5, 16) },
    { id: 2, title: "Meeting", date: new Date(2025, 5, 17), color: "success", startDate: new Date(2025, 5, 17), endDate: new Date(2025, 5, 17) },
    { id: 3, title: "Workshop", date: new Date(2025, 5, 18), color: "primary", startDate: new Date(2025, 5, 18), endDate: new Date(2025, 5, 18) },
  ]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", color: "primary", startDate: "", endDate: "" });
  const [showCreateRewardModal, setShowCreateRewardModal] = useState(false);
 
 const [isFetchingProducts, setIsFetchingProducts] = useState(false);
const [premiumProducts, setPremiumProducts] = useState([]);
// Remplacer l'ancienne vérification par produit par cette version optimisée
// 1. Modifier la fonction fetchPremiumStatus pour qu'elle retourne une promesse
// 4. Fonction améliorée pour vérifier le statut premium

// Appeler cette fonction quand les produits changent

const PaymentMethodSetup = ({ merchantId, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements) return;

    try {
      // Créer la méthode de paiement
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) throw stripeError;

      // Envoyer au backend
      const response = await fetch('http://192.168.43.57:5000/api/merchant/setup-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          merchantId,
          paymentMethodId: paymentMethod.id
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Erreur serveur");
      }

      onSuccess(); // Fermer le formulaire et réessayer
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
          },
        }} />
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded"
        >
          Annuler
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!stripe || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer la carte'}
        </button>
      </div>
      
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
};
  const getLast6MonthsLabels = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
    }
    return months;
  };

  const processStockHistory = (historyData, currentStock) => {
    if (!historyData || historyData.length === 0) return Array(6).fill(currentStock);
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      months.push({ startDate, endDate, label: startDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) });
    }
    const monthlyStocks = [];
    const sortedHistory = [...historyData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (let i = 0; i < months.length; i++) {
      let stockAtEndOfMonth = null;
      for (let j = sortedHistory.length - 1; j >= 0; j--) {
        const entryDate = new Date(sortedHistory[j].createdAt);
        if (entryDate <= months[i].endDate) {
          stockAtEndOfMonth = sortedHistory[j].stockAfter;
          break;
        }
      }
      if (stockAtEndOfMonth === null) {
        stockAtEndOfMonth = i === 0 ? (sortedHistory[0] ? Math.max(0, sortedHistory[0].stockAfter - sortedHistory[0].quantity) : currentStock) : monthlyStocks[i - 1];
      }
      monthlyStocks.push(stockAtEndOfMonth);
    }
    return monthlyStocks;
  };

  const fetchStockHistory = async (productId, shopId) => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const url = `http://localhost:5000/api/stock/history/public?productId=${productId}&shopId=${shopId}&since=${sixMonthsAgo.toISOString()}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Erreur fetchStockHistory:', error);
      return [];
    }
  };

  const loadStockHistoryForProduct = async (product, shopId) => {
    try {
      const historyData = await fetchStockHistory(product._id, shopId);
      const monthlyStocks = processStockHistory(historyData, product.stock || 0);
      return { labels: getLast6MonthsLabels(), data: monthlyStocks, rawHistory: historyData };
    } catch (error) {
      console.error('Erreur loadStockHistoryForProduct:', error);
      return { labels: getLast6MonthsLabels(), data: Array(6).fill(product.stock || 0), rawHistory: [] };
    }
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setStockHistoryLoading(true);
    try {
      let shopId = selectedShopId || user?.shopId || (products.length > 0 ? products[0].shopId : "");
      if (!shopId) throw new Error("ShopId non trouvé");
      const result = await loadStockHistoryForProduct(product, shopId);
      setStockHistoryData(result.data);
      setStockHistoryLabels(result.labels);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
      setStockHistoryData(Array(6).fill(product.stock || 0));
      setStockHistoryLabels(getLast6MonthsLabels());
    } finally {
      setStockHistoryLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    return days;
  };

  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getHourSlots = () => {
    const slots = ['all-day'];
    for (let hour = 0; hour < 24; hour++) {
      if (hour === 0) slots.push('12am');
      else if (hour < 12) slots.push(`${hour}am`);
      else if (hour === 12) slots.push('12pm');
      else slots.push(`${hour - 12}pm`);
    }
    return slots;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") newDate.setMonth(currentDate.getMonth() + direction);
    else if (calendarView === "week") newDate.setDate(currentDate.getDate() + (direction * 7));
    else newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    if (calendarView === "month") return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    else if (calendarView === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    if (dateString instanceof Date) return dateString.toLocaleDateString();
    try { return new Date(dateString).toLocaleDateString(); } catch { return dateString.toString(); }
  };

  const getEventsForDate = (date) => {
  return events.filter(event => {
    const eventStart = new Date(event.startDate);
    return eventStart.toDateString() === date.toDateString();
  });
};

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const handleAddEvent = () => {
  console.log("newEvent avant ajout:", newEvent);
  if (newEvent.title && newEvent.startDate) {
    const event = {
      id: Date.now(),
      title: newEvent.title,
      color: newEvent.color,
      startDate: new Date(newEvent.startDate),
      endDate: newEvent.endDate ? new Date(newEvent.endDate) : new Date(newEvent.startDate),
    };
    console.log("Nouvel événement:", event);
    setEvents([...events, event]);
    setNewEvent({ title: "", color: "primary", startDate: "", endDate: "" });
    setShowAddEventModal(false);
  } else {
    console.log("Ajout annulé : title ou startDate manquant");
  }
};

  const getColorClass = (color) => {
    switch (color) {
      case 'danger': return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'success': return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      case 'primary': return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      default: return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };

  const renderCalendar = () => {
    if (calendarView === "month") {
      const days = getDaysInMonth(currentDate);
      return (
        <div className="grid grid-cols-7 gap-1">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">{day}</div>
          ))}
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            return (
              <div key={index} className={`min-h-[80px] p-1 border border-gray-200 ${day.isCurrentMonth ? 'bg-white cursor-pointer hover:bg-gray-100' : 'bg-gray-50'}`} onClick={() => day.isCurrentMonth && handleDayClick(day.date)}>
                <div className={`text-sm ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>{day.date.getDate()}</div>
                {dayEvents.map(event => (
                  <div key={event.id} className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${getColorClass(event.color)}`} onClick={e => { e.stopPropagation(); handleEventClick(event); }}>
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    } else if (calendarView === "week") {
      const weekDays = getWeekDays(currentDate);
      const hourSlots = getHourSlots();
      return (
        <div className="grid grid-cols-8 gap-1">
          <div></div>{weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center border-b">
              <div className="text-sm font-medium text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} {day.getMonth() + 1}/{day.getDate()}</div>
            </div>
          ))}
          {hourSlots.map((hour, hourIndex) => (
            <React.Fragment key={hourIndex}>
              <div className="p-2 text-xs text-gray-500 border-r">{hour}</div>
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div key={dayIndex} className="min-h-[40px] border border-gray-200 p-1 cursor-pointer hover:bg-gray-100" onClick={() => handleDayClick(day)}>
                    {hourIndex === 0 && dayEvents.map(event => (
                      <div key={event.id} className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${getColorClass(event.color)}`} onClick={e => { e.stopPropagation(); handleEventClick(event); }}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      );
    } else {
      const hourSlots = getHourSlots();
      const dayEvents = getEventsForDate(currentDate);
      return (
        <div>
          <div className="mb-4 p-3 bg-gray-50 rounded"><h3 className="font-medium text-gray-900">{currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</h3></div>
          {hourSlots.map((hour, index) => {
            let hourValue = hour === 'all-day' ? 0 : hour.includes('pm') && !hour.includes('12pm') ? parseInt(hour) + 12 : hour.includes('12am') ? 0 : hour.includes('am') ? parseInt(hour) : hour.includes('12pm') ? 12 : parseInt(hour) - 12;
            return (
              <div key={index} className="grid grid-cols-4 border-b border-gray-200">
                <div className="p-3 text-sm text-gray-500 border-r">{hour}</div>
                <div className="col-span-3 min-h-[50px] p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleDayClick(currentDate, hourValue)}>
                  {dayEvents.filter(event => hour === 'all-day' || new Date(event.startDate).getHours() === hourValue).map(event => (
                    <div key={event.id} className={`text-sm p-2 rounded mb-2 cursor-pointer hover:opacity-80 ${getColorClass(event.color)}`} onClick={e => { e.stopPropagation(); handleEventClick(event); }}>
                      {event.title}{hour !== 'all-day' && <div className="text-xs mt-1">{new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

 const handleDayClick = (date, hour = null) => {
  // Créer une copie de la date pour éviter de modifier l'original
  let startDateObj = new Date(date);
  let endDateObj = new Date(date);

  if (hour !== null) {
    // Appliquer setHours et créer un nouvel objet Date
    startDateObj.setHours(hour, 0, 0, 0);
    endDateObj.setHours(hour, 0, 0, 0);
    setNewEvent({
      title: "",
      color: "primary",
      startDate: startDateObj.toISOString().slice(0, 16), // Format avec heure et minutes
      endDate: endDateObj.toISOString().slice(0, 16),
    });
  } else {
    // Cas sans heure (vue mois ou semaine)
    setNewEvent({
      title: "",
      color: "primary",
      startDate: date.toISOString().split('T')[0], // Juste la date (YYYY-MM-DD)
      endDate: date.toISOString().split('T')[0],
    });
  }
  setShowAddEventModal(true);
};

  const getSubSectionChart = () => {
    switch (activeSubSection) {
      case "ecommerce":
        return {
          type: "bar", Component: Bar,
          data: { labels: merchantStats?.[0]?.monthlyStats?.map((stat) => stat.month) || [], datasets: [{ label: "Ventes (€)", data: merchantStats?.[0]?.monthlyStats?.map((stat) => stat.revenue) || [], backgroundColor: "#4BC0C0" }] },
          options: { responsive: true, plugins: { title: { display: true, text: "Ventes Mensuelles" } } },
        };
      case "analytics":
        return {
          type: "pie", Component: Pie,
          data: { labels: ["Visiteurs Uniques", "Pages Vues"], datasets: [{ data: [analytics.uniqueVisitors || 0, analytics.totalPageviews || 0], backgroundColor: ["#36A2EB", "#FF6384"] }] },
          options: { responsive: true, plugins: { title: { display: true, text: "Répartition des Interactions" } } },
        };
      case "marketing":
        return {
          type: "pie", Component: Pie,
          data: { labels: ["Positifs", "Négatifs", "Neutres"], datasets: [{ data: [
            analytics.reviewsMetrics?.positiveRate || 0,
            analytics.reviewsMetrics?.negativeRate || 0,
            100 - (analytics.reviewsMetrics?.positiveRate || 0) - (analytics.reviewsMetrics?.negativeRate || 0)
          ], backgroundColor: ["#4BC0C0", "#FF6384", "#FFCE56"] }] },
          options: { responsive: true, plugins: { title: { display: true, text: "Répartition des Avis" } } },
        };
      case "crm":
        return {
          type: "bar", Component: Bar,
          data: { labels: Object.keys(segments), datasets: [{ label: "Nombre de clients", data: Object.values(segments), backgroundColor: ["#36A2EB", "#FF6384"] }] },
          options: { responsive: true, plugins: { title: { display: true, text: `Segments (${segmentationType})` } } },
        };
      case "stocks":
        return (
          <div>
            <div className="bg-white p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold mb-4">Stocks</h2>
              <div className="max-w-full">
                <Bar
                  data={{ labels: products.map(p => p.name), datasets: [{ label: "Stock Disponible", data: products.map(p => p.stock || 0), backgroundColor: "#36A2EB", borderColor: "#1E90FF", borderWidth: 1 }] }}
                  options={{
                    responsive: true, plugins: { title: { display: true, text: "Niveau de Stock - Cliquez pour voir l'historique" }, legend: { display: true } },
                    scales: { y: { beginAtZero: true, title: { display: true, text: "Stock" } }, x: { title: { display: true, text: "Produits" } } },
                    onClick: (event, elements) => elements.length > 0 && handleProductClick(products[elements[0].index]),
                    onHover: (event, elements) => event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default"
                  }}
                />
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded-md mt-2 text-xs">
              <p><strong>Debug:</strong> Produits chargés: {products.length}</p>
              <p>ShopId sélectionné: {selectedShopId || user?.shopId || "Non défini"}</p>
              {selectedProduct && <p>Produit sélectionné: {selectedProduct.name} (ID: {selectedProduct._id})</p>}
            </div>
            {selectedProduct && (
              <div className="bg-white p-4 rounded-md shadow-md mt-6">
                <h3 className="text-xl font-semibold mb-4">Évolution du stock - {selectedProduct.name}</h3>
                <div className="bg-yellow-50 p-2 rounded-md mb-4 text-xs">
                  <p><strong>Debug données:</strong></p>
                  <p>Stock actuel du produit: {selectedProduct.stock}</p>
                  <p>Données historique: {JSON.stringify(stockHistoryData)}</p>
                  <p>Labels: {JSON.stringify(stockHistoryLabels)}</p>
                </div>
                <div className="h-64">
                  {stockHistoryLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div><p>Chargement de l'historique...</p></div>
                    </div>
                  ) : (
                    <Line
                      data={{ labels: stockHistoryLabels, datasets: [{ label: "Stock", data: stockHistoryData, fill: false, borderColor: "#36A2EB", backgroundColor: "rgba(54, 162, 235, 0.1)", tension: 0.1, pointBackgroundColor: "#36A2EB", pointBorderColor: "#36A2EB", pointRadius: 5, pointHoverRadius: 7 }] }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: `Évolution du Stock - ${selectedProduct.name} (6 derniers mois)` }, legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: "Stock" }, ticks: { stepSize: 1 } }, x: { title: { display: true, text: "Mois" } } } }}
                    />
                  )}
                </div>
                {!stockHistoryLoading && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Statistiques de stock :</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div><p className="text-sm text-gray-600">Stock actuel</p><p className="font-semibold">{stockHistoryData[stockHistoryData.length - 1] || 0} unités</p></div>
                      <div><p className="text-sm text-gray-600">Stock il y a 6 mois</p><p className="font-semibold">{stockHistoryData[0] || 0} unités</p></div>
                      <div><p className="text-sm text-gray-600">Évolution</p><p className={`font-semibold ${((stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)) >= 0 ? '+' : ''}{(stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)} unités
                      </p></div>
                    </div>
                    <div className="mt-4"><h5 className="font-semibold mb-2">Détail par mois :</h5>
                      <div className="grid grid-cols-6 gap-2">{stockHistoryLabels.map((month, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-center">
                          <p className="text-xs text-gray-600">{month}</p><p className="font-semibold text-blue-600">{stockHistoryData[index] || 0}</p>
                        </div>
                      ))}</div>
                    </div>
                  </div>
                )}
                {message && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{message}</div>}
                <button onClick={() => { setSelectedProduct(null); setMessage(""); }} className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">Fermer</button>
              </div>
            )}
          </div>
        );
      case "saas":
        return {
          type: "radar", Component: Radar,
          data: { labels: ["Utilisation", "Performance", "Satisfaction"], datasets: [{ label: "Métriques SaaS", data: [80, 70, 90], backgroundColor: "rgba(54, 162, 235, 0.2)", borderColor: "#36A2EB", pointBackgroundColor: "#36A2EB" }] },
          options: { responsive: true, plugins: { title: { display: true, text: "Vue d'Ensemble SaaS" } } },
        };
      default:
        return {
          type: "line", Component: Line,
          data: { labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], datasets: [{ label: "Points Distribués", data: [200, 300, 250, 400, 600, 800, 500], borderColor: "rgba(75, 192, 192, 1)", backgroundColor: "rgba(75, 192, 192, 0.2)", fill: false }] },
          options: { responsive: true, plugins: { title: { display: true, text: "Évolution des Points Distribués" } } },
        };
    }
  };

  const updateSegments = () => {
    let newSegments = {};
    filteredCustomers.forEach((customer) => {
      let key = segmentationType === "frequencyVariation" ? (customer.frequencyVariation || 0) >= Number(segmentationThreshold) ? "Haut" : "Bas" :
        segmentationType === "averageOrderAmount" ? (customer.averageOrderAmount || 0) >= Number(segmentationThreshold) ? "Haut" : "Bas" : "";
      newSegments[key] = (newSegments[key] || 0) + 1;
    });
    setSegments(newSegments);
  };

  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d’authentification manquant");
      const response = await fetch(`http://192.168.43.57:5000/api/order/orders/recent?merchantId=${user.merchantId}&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      setRecentOrders(await response.json() || []);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d’authentification manquant");
      const response = await fetch("http://192.168.43.57:5000/api/merchant/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Erreur ${response.status}: ${(await response.json()).message || "Erreur inconnue"}`);
      setNotifications((await response.json()).notifications || []);
    } catch (error) {
      console.error("Erreur détaillée lors de la récupération des notifications:", error);
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const fetchMerchantStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.merchantId) throw new Error("Données manquantes");
      const queryParams = new URLSearchParams({ merchantId: user.merchantId });
      if (compareStartMonth) queryParams.append("startDate", `${compareStartMonth}-01`);
      if (compareEndMonth) queryParams.append("endDate", `${compareEndMonth}-01`);
      const response = await fetch(`http://192.168.43.57:5000/api/merchant/stats?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      setMerchantStats(await response.json() || []);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

const fetchDemographicData = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("🔍 Token utilisé:", token?.slice(0, 20) + "..."); // Affiche une partie du token
    console.log("🔍 MerchantId:", user?.merchantId);
    if (!token) throw new Error("Token d'authentification manquant");
    if (!user?.merchantId) throw new Error("MerchantId manquant");

    const response = await fetch(
      `http://192.168.43.57:5000/api/order/orders/by-country?merchantId=${user.merchantId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("🔍 Statut HTTP:", response.status);
    console.log("🔍 URL appelée:", response.url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log("🔍 Données reçues du backend:", JSON.stringify(data, null, 2));
    console.log("🔍 Type de data:", typeof data);
    console.log("🔍 Est-ce un array?", Array.isArray(data));
    console.log("🔍 Longueur:", data?.length);

    let countries = [];
    if (Array.isArray(data)) {
      countries = data;
      console.log("✅ Données reçues comme tableau de pays:", countries);
    } else {
      console.warn("⚠️ Format inattendu des données:", data);
    }

    console.log("🗺️ Countries finaux:", countries);
    console.log("🗺️ Nombre de countries:", countries.length);

    if (countries.length > 0) {
      const totalCustomers = countries.reduce((sum, c) => sum + (c.count || 0), 0);
      console.log("📊 Total clients calculé:", totalCustomers);
      setDemographicData({ data, totalCustomers });
    } else {
      console.warn("⚠️ Aucun pays trouvé dans les données");
      setDemographicData({ data: [], totalCustomers: 0 });
    }
  } catch (error) {
    console.error("❌ Erreur fetchDemographicData:", error);
    setMessage(`❌ Erreur : ${error.message}`);
    setDemographicData({ data: [], totalCustomers: 0 });
  }
};

// Composant DemographicMap amélioré avec debug

useEffect(() => {
  if (user?.merchantId) {
    fetchDemographicData();
  }
}, [user?.merchantId]);

  function getFlagEmoji(country) {
    const countryCodes = { "Tunisie": "TN", "France": "FR", "Canada": "CA", "Maroc": "MA", "Allemagne": "DE", "Espagne": "ES", "Italie": "IT", "Belgique": "BE", "Suisse": "CH", "Algérie": "DZ" };
    return String.fromCodePoint(...(countryCodes[country] || "XX").toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt() - 65));
  }

  const fetchAllForecasts = async (lat, lon) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d’authentification manquant");
      const [seasonalResponse, weatherAdjustedResponse] = await Promise.all([
        fetch(`http://localhost:8000/forecast/all?merchantId=${user.merchantId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8000/forecast/weather-adjusted?merchantId=${user.merchantId}&lat=${lat}&lon=${lon}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!seasonalResponse.ok || !weatherAdjustedResponse.ok) throw new Error("Erreur lors de la récupération des prévisions");
      const seasonalData = await seasonalResponse.json();
      const weatherAdjustedData = await weatherAdjustedResponse.json();
      const mergedForecasts = weatherAdjustedData.map(adjusted => ({ ...seasonalData.find(s => s.productId === adjusted.productId) || {}, ...adjusted, weatherData: adjusted.weatherData || {} }));
      setForecasts(mergedForecasts);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessage("❌ La géolocalisation n'est pas prise en charge par ce navigateur.");
      fetchAllForecasts(35.762839848752215, 10.809014675172923);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => fetchAllForecasts(position.coords.latitude, position.coords.longitude),
      (error) => { setMessage(`❌ Erreur de géolocalisation : ${error.message}`); fetchAllForecasts(35.762839848752215, 10.809014675172923); },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  };

  const applyFilters = (customers) => {
    let filtered = [...customers];
    if (searchTerm) filtered = filtered.filter(customer => customer.nom?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filters.minPoints) filtered = filtered.filter(customer => customer.loyaltyPoints >= Number(filters.minPoints));
    if (filters.minOrders) filtered = filtered.filter(customer => customer.orderCount >= Number(filters.minOrders));
    if (filters.lastVisit) filtered = filtered.filter(customer => new Date(customer.lastOrderDate) >= new Date(filters.lastVisit));
    return filtered;
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token || !pointsToAdd.userId || !pointsToAdd.points || pointsToAdd.points <= 0) throw new Error("Données invalides");
      const response = await fetch("http://192.168.43.57:5000/api/merchant/add-points", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: user.merchantId, ...pointsToAdd, points: Number(pointsToAdd.points) })
      });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      const data = await response.json();
      setLoyalCustomers(prev => prev.map(customer => customer.userId.toString() === pointsToAdd.userId ? { ...customer, loyaltyPoints: data.updatedPoints } : customer));
      setPointsToAdd({ userId: "", points: "" });
      setMessage(`✅ ${data.pointsAdded} points ajoutés à l'utilisateur ${pointsToAdd.userId}`);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token || !notificationMessage.trim()) throw new Error("Message invalide");
      const userIds = selectedUserId ? [selectedUserId] : loyalCustomers.map(customer => customer.userId.toString());
      if (userIds.length === 0) throw new Error("Aucun client sélectionné");
      const response = await fetch("http://192.168.43.57:5000/api/merchant/send-notification", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: user.merchantId, userIds, message: notificationMessage })
      });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      const data = await response.json();
      setNotificationMessage(""); setSelectedUserId(""); setShowNotificationMenu(false);
      setMessage(`✅ Notification envoyée à ${data.notifications.length} client(s) !`);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };
// 1. Modifier MerchantPremiumPayment avec meilleure gestion des callbacks
const MerchantPremiumPayment = ({ productId, merchantId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Debug: Vérifier les props reçues
  useEffect(() => {
    console.log("🔍 MerchantPremiumPayment - Props reçues:", {
      productId,
      merchantId,
      hasStripe: !!stripe,
      hasElements: !!elements
    });
    
    setDebugInfo({
      productId,
      merchantId,
      hasStripe: !!stripe,
      hasElements: !!elements,
      hasToken: !!localStorage.getItem('token')
    });
  }, [productId, merchantId, stripe, elements]);

  const handleShowCard = () => {
    console.log("🔵 Affichage de la carte demandé");
    setShowCard(true);
    setError(null);
  };

  const handleCancel = () => {
    console.log("🔴 Annulation du paiement");
    setShowCard(false);
    setError(null);
  };

  const testConnection = async () => {
    try {
      console.log("🧪 Test de connexion au backend...");
      
      const response = await fetch('http://192.168.43.57:5000/api/merchant/check-payment-method', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("📡 Réponse du serveur:", response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Connexion OK:", data);
        setError(null);
        return true;
      } else {
        console.log("❌ Erreur de connexion:", response.status);
        setError(`Erreur serveur: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Erreur de test de connexion:", error);
      setError(`Erreur de connexion: ${error.message}`);
      return false;
    }
  };

  const handlePayment = async () => {
    console.log("💳 Début du processus de paiement");
    
    if (!stripe || !elements) {
      const errorMsg = "Le système de paiement n'est pas prêt";
      console.error("❌", errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Test de connexion d'abord
      console.log("🧪 Test de connexion préalable...");
      const connectionOK = await testConnection();
      if (!connectionOK) {
        throw new Error("Connexion au serveur impossible");
      }

      // 2. Vérifier la carte
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Élément de carte non trouvé");
      }

      console.log("💳 Création de la méthode de paiement...");
      
      // 3. Créer la méthode de paiement
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        console.error("❌ Erreur Stripe:", stripeError);
        throw new Error(stripeError.message);
      }

      console.log("✅ Méthode de paiement créée:", paymentMethod.id);

      // 4. Préparer les données pour le backend
      const paymentData = {
        productId,
        merchantId,
        paymentMethodId: paymentMethod.id
      };

      console.log("📤 Envoi des données au backend:", paymentData);

      // 5. Envoyer au backend avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes

      const response = await fetch('http://192.168.43.57:5000/api/merchant/premium-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log("📡 Réponse du backend:", response.status, response.statusText);

      const data = await response.json();
      console.log("📦 Données reçues:", data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur serveur: ${response.status}`);
      }

      // 6. Succès
      console.log("✅ Paiement réussi!");
      setShowCard(false);
      
      if (onSuccess) {
        onSuccess(productId);
      }

    } catch (err) {
      console.error("❌ Erreur dans handlePayment:", err);
      
      let errorMessage = "Erreur inconnue";
      
      if (err.name === 'AbortError') {
        errorMessage = "Timeout: Le serveur met trop de temps à répondre";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Informations de debug */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <div>Product: {debugInfo.productId}</div>
        <div>Merchant: {debugInfo.merchantId}</div>
        <div>Stripe: {debugInfo.hasStripe ? '✅' : '❌'}</div>
        <div>Elements: {debugInfo.hasElements ? '✅' : '❌'}</div>
        <div>Token: {debugInfo.hasToken ? '✅' : '❌'}</div>
      </div>

      {/* Bouton de test de connexion */}
      <button
        onClick={testConnection}
        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
      >
        🧪 Test Connexion
      </button>

      {!showCard ? (
        <button
          onClick={handleShowCard}
          disabled={!stripe || !elements}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Activer Premium (5€)
        </button>
      ) : (
        <div className="animate-fadeIn">
          <div className="border rounded-lg p-3 bg-gray-50 mb-2">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: true
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 flex-1"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handlePayment}
              disabled={!stripe || !elements || loading}
              className={`px-3 py-1 text-sm text-white rounded flex-1 ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Traitement...' : 'Payer 5€'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
          ✕ {error}
        </div>
      )}
    </div>
  );
};
// 2. Fonction pour gérer le succès du paiement premium
const handlePremiumPaymentSuccess = async (productId) => {
  console.log("🔵 Callback success appelé pour productId:", productId);
  
  try {
    // 1. Mise à jour immédiate de l'état local
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p._id === productId
          ? { 
              ...p, 
              premiumAccess: true,
              premiumPaymentDate: new Date().toISOString(),
              premiumPaymentIntentId: `payment_${Date.now()}`
            }
          : p
      )
    );
    
    // 2. Message de succès immédiat
    setMessage("✅ Premium activé avec succès !");
    
    // 3. Vérification en arrière-plan (sans bloquer l'UI)
    setTimeout(async () => {
      try {
        await fetchPremiumStatus();
        console.log("✅ Synchronisation premium terminée");
      } catch (error) {
        console.error("❌ Erreur synchronisation:", error);
      }
    }, 1000);
    
    // 4. Effacer le message après 5 secondes
    setTimeout(() => setMessage(""), 5000);
    
  } catch (error) {
    console.error("❌ Erreur dans handlePremiumPaymentSuccess:", error);
    setMessage("⚠️ Premium activé mais erreur d'affichage");
  }
};

// 3. Fonction pour forcer la mise à jour d'un produit (debug)
const forceUpdateProduct = async (productId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      'http://192.168.43.57:5000/api/merchant/debug-update-product',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("🔧 Force update result:", data);
    
    if (data.success && data.productAfter) {
      // Mise à jour ciblée du produit
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId 
            ? { ...p, ...data.productAfter }
            : p
        )
      );
      
      setMessage("🔧 Produit mis à jour en mode debug");
    }
    
  } catch (error) {
    console.error("❌ Erreur force update:", error);
    setMessage("❌ Erreur lors de la mise à jour debug");
  }
};

// 4. Fonction améliorée pour vérifier le statut premium
const fetchPremiumStatus = async () => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token || !user?.merchantId) {
      console.warn("Token ou merchantId manquant");
      return [];
    }

    const response = await fetch(
      `http://192.168.43.57:5000/api/merchant/premium-products?merchantId=${user.merchantId}`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.premiumProducts) {
      const premiumProductIds = data.premiumProducts;
      
      // Mise à jour des produits avec le statut premium
      setProducts(prevProducts => 
        prevProducts.map(product => ({
          ...product,
          premiumAccess: premiumProductIds.includes(product._id) || product.premiumAccess
        }))
      );
      
      console.log("🔍 Statut premium mis à jour:", premiumProductIds);
      return premiumProductIds;
    }
    
    return [];
    
  } catch (error) {
    console.error("❌ Erreur vérification premium:", error);
    return [];
  }
};

// 5. Fonction pour rafraîchir tous les produits
const refreshProducts = async () => {
  // Éviter les appels multiples
  if (isFetchingProducts) {
    console.log("🔄 Rafraîchissement déjà en cours...");
    return;
  }
  
  setIsFetchingProducts(true);
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token || !user?.shopId) {
      console.warn("Token ou shopId manquant");
      return;
    }

    const response = await fetch(
      `http://192.168.43.57:5000/api/merchant/products?shopId=${user.shopId}`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.products) {
      setProducts(data.products);
      console.log("🔄 Produits rafraîchis:", data.products.length);
    }
    
  } catch (error) {
    console.error("❌ Erreur rafraîchissement produits:", error);
    setMessage("⚠️ Erreur lors du rafraîchissement");
  } finally {
    setIsFetchingProducts(false);
  }
};






  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token || !stockForm.name || !stockForm.price || !stockForm.category || stockForm.stock < 0) throw new Error("Données invalides");
      const response = await fetch("http://192.168.43.57:5000/api/merchant/products", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...stockForm, price: Number(stockForm.price), stock: Number(stockForm.stock) })
      });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      const data = await response.json();
      setProducts(prev => response.status === 200 ? prev.map(p => p._id === data.product._id ? { ...p, stock: data.product.stock } : p) : [...prev, data.product]);
      setMessage(response.status === 200 ? "✅ Stock mis à jour avec succès !" : "✅ Produit ajouté avec succès !");
      setStockForm({ name: "", price: "", category: "", stock: "" });
      await fetchNotifications();
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || newStock < 0) throw new Error("Données invalides");
      const response = await fetch(`http://192.168.43.57:5000/api/merchant/products/${productId}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(newStock) })
      });
      if (!response.ok) throw new Error((await response.json()).message || "Erreur");
      const data = await response.json();
      setProducts(prev => prev.map(product => product._id === productId ? { ...product, stock: data.product.stock } : product));
      setMessage(data.isOutOfStock ? "✅ Stock mis à jour - Rupture de stock !" : "✅ Stock mis à jour avec succès !");
      await fetchNotifications();
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdatePointsConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d’authentification manquant");
      const response = await fetch("http://192.168.43.57:5000/api/merchant/update-points-config", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ merchantId: user.merchantId, multipliers: pointsConfig.multipliers, enabled: pointsConfig.enabled })
      });
      const data = await response.json();
      if (response.ok) alert("Configuration mise à jour avec succès");
      else alert(`Erreur : ${data.message}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert(`❌ Erreur : ${error.message}`);
    }
  };

const fetchAnalyticsData = async (targetId = user.merchantId, period = "monthly") => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token d'authentification manquant");

    // Première série de requêtes
    const [response, dailyResponse, topPagesResponse] = await Promise.all([
      fetch(`http://192.168.43.57:5000/api/interactions/analytics-by-shop?targetId=${targetId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }),
      fetch(`http://192.168.43.57:5000/api/interactions/analytics-by-shop/daily?targetId=${targetId}&days=30`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }),
      fetch(`http://192.168.43.57:5000/api/interactions/analytics-by-shop/top-pages?targetId=${targetId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    ]);

    // Vérifier les statuts AVANT de lire les JSON
    const responses = [
      { response, name: 'analytics' },
      { response: dailyResponse, name: 'daily' },
      { response: topPagesResponse, name: 'topPages' }
    ];

    // Trouver la première réponse en erreur
    const failedResponse = responses.find(r => !r.response.ok);
    if (failedResponse) {
      const errorText = await failedResponse.response.text(); // Utiliser text() au lieu de json()
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || `Erreur HTTP ${failedResponse.response.status}`;
      } catch {
        errorMessage = `Erreur HTTP ${failedResponse.response.status}: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    // Lire les JSON seulement si toutes les réponses sont OK
    const [data, dailyData, topPagesData] = await Promise.all([
      response.json(),
      dailyResponse.json(),
      topPagesResponse.json()
    ]);

    // Requête séparée pour les métriques des avis
    const reviewsMetricsResponse = await fetch(
      `http://192.168.43.57:5000/api/interactions/analytics-by-shop/reviews-metrics?targetId=${targetId}&period=${period}`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let reviewsMetricsData = {};
    if (reviewsMetricsResponse.ok) {
      reviewsMetricsData = await reviewsMetricsResponse.json();
    } else {
      console.warn('Impossible de charger les métriques des avis:', reviewsMetricsResponse.status);
    }

    // Mise à jour unique de l'état avec toutes les données
    setAnalytics({
      ...data,
      dailyVisitors: dailyData.dailyVisitors || [],
      topPages: topPagesData.topPages || [],
      reviewsMetrics: reviewsMetricsData
    });

  } catch (error) {
    console.error('Erreur dans fetchAnalyticsData:', error);
    setMessage(`❌ Erreur : ${error.message}`);
  }
};

 const getProductNameById = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : "Produit inconnu";
  };

const handleCreateReward = async (e) => {
  e.preventDefault();
  try {
    const baseRewardData = {
      type: rewardForm.type,
      startDate: rewardForm.startDate,
      endDate: rewardForm.endDate,
      merchantId: user.merchantId,
    };
    let rewardData = { ...baseRewardData };

    if (rewardForm.type === "promotion") {
      if (!rewardForm.productIds.length || !rewardForm.discountValue) {
        alert("Veuillez sélectionner au moins un produit et définir une valeur de réduction.");
        return;
      }
      rewardData.productIds = rewardForm.productIds;
      rewardData.discountValue = parseFloat(rewardForm.discountValue);
      
      rewardData.discountValues = rewardForm.discountValues.map((v, index) => {
        return v && v !== "" ? parseFloat(v) : parseFloat(rewardForm.discountValue);
      });
      
      console.log("Données envoyées:", {
        productIds: rewardData.productIds,
        discountValue: rewardData.discountValue,
        discountValues: rewardData.discountValues
      });
    } 
    
    else if (rewardForm.type === "specialOffer") {
      if (!rewardForm.specialOffer.type || !rewardForm.specialOffer.minPoints) {
        alert("Veuillez sélectionner un type d'offre spéciale et définir les points minimum.");
        return;
      }
      
      // Créer l'objet specialOffer de base
      const specialOfferData = { 
        type: rewardForm.specialOffer.type,
        minPoints: parseInt(rewardForm.specialOffer.minPoints) || 0 
      };
      
      // Ajouter les champs spécifiques selon le type
      if (rewardForm.specialOffer.type === "multiplicationPoints") {
        if (!rewardForm.specialOffer.multiplier) {
          alert("Veuillez définir le multiplicateur pour la multiplication de points.");
          return;
        }
        specialOfferData.multiplier = parseInt(rewardForm.specialOffer.multiplier) || 1;
        
        // Pour multiplicationPoints, on n'envoie PAS buyProductId et getProductId
        // même s'ils sont vides dans le formulaire
        
      } else if (rewardForm.specialOffer.type === "buyOneGetOne") {
        if (!rewardForm.specialOffer.buyProductId || !rewardForm.specialOffer.getProductId) {
          alert("Veuillez sélectionner un produit à acheter et un produit gratuit.");
          return;
        }
        specialOfferData.buyProductId = rewardForm.specialOffer.buyProductId;
        specialOfferData.getProductId = rewardForm.specialOffer.getProductId;
      }
      
      rewardData.specialOffer = specialOfferData;
      
      console.log("Données specialOffer envoyées:", specialOfferData);
    } 
    
    else if (rewardForm.type === "customOffer") {
      if (!rewardForm.customTitle || !rewardForm.customDescription) {
        alert("Veuillez entrer un titre et une description pour l'offre personnalisée.");
        return;
      }
      rewardData.customOffer = {
        title: rewardForm.customTitle,
        description: rewardForm.customDescription,
        terms: rewardForm.customTerms || "",
        minPoints: parseInt(rewardForm.customMinPoints) || 0,
      };
    }

    console.log("Données complètes envoyées:", rewardData);

    const response = await fetch("http://localhost:5000/api/merchant/create-reward", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${localStorage.getItem("token")}` 
      },
      body: JSON.stringify(rewardData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur API:", errorData);
      alert(`Erreur lors de la création: ${errorData.message}`);
      return;
    }

    const data = await response.json();
    console.log("Réponse création:", data);
    
    alert("Récompense(s) créée(s) avec succès !");
    setShowCreateRewardModal(false);
    
    // Reset du formulaire
    setRewardForm({
      type: "",
      productIds: [],
      discountValue: "",
      discountValues: [],
      additionalProducts: 0,
      specialOffer: { 
        type: "", 
        multiplier: 2, 
        buyProductId: "", 
        getProductId: "", 
        minPoints: 0 
      },
      startDate: "",
      endDate: "",
      customTitle: "",
      customDescription: "",
      customTerms: "",
      customMinPoints: 0,
    });
    
    await fetchRewards();
  } catch (error) {
    console.error("Erreur non gérée:", error);
    alert("Une erreur s'est produite lors de la création de la récompense. Veuillez réessayer.");
  }
};
const fetchCustomers = async () => {
  if (!user?.merchantId) {
    console.error("❌ Aucun merchantId disponible");
    setError("Aucun identifiant de boutique disponible.");
    setLoadingCustomers(false);
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ Aucun jeton d'authentification trouvé");
    setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
    setLoadingCustomers(false);
    return;
  }

  setLoadingCustomers(true);
  try {
    const response = await fetch(
      `http://localhost:5000/api/merchant/customers?merchantId=${encodeURIComponent(user.merchantId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("📊 Clients reçus:", data);
      const customersData = Array.isArray(data.customers) ? data.customers : data || [];
      setCustomers(customersData);
      console.log(`✅ ${customersData.length} clients chargés pour ${user.merchantId}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
      setError(`Erreur lors du chargement des clients: ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
    setError("Erreur réseau lors du chargement des clients. Vérifiez votre connexion.");
  } finally {
    setLoadingCustomers(false);
  }
};
  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm({
      type: reward.type,
      productIds: reward.productIds || [],
      discountValue: reward.discountValue || "",
      discountValues: reward.discountValues || [],
      additionalProducts: (reward.productIds?.length || 0) - 1,
      specialOffer: reward.specialOffer || { type: "", multiplier: 2, buyProductId: "", getProductId: "", minPoints: 0 },
      startDate: reward.startDate,
      endDate: reward.endDate,
      customTitle: reward.customOffer?.title || "",
      customDescription: reward.customOffer?.description || "",
      customTerms: reward.customOffer?.terms || "",
      customMinPoints: reward.customOffer?.minPoints || 0,
    });
    setShowEditRewardModal(true);
  };

 const handleUpdateReward = async (e) => {
    e.preventDefault();
    try {
      const updatedRewardData = {
        type: rewardForm.type,
        startDate: rewardForm.startDate,
        endDate: rewardForm.endDate,
        merchantId: user.merchantId,
      };

      if (rewardForm.type === "promotion") {
        if (!rewardForm.productIds.length || !rewardForm.discountValue) {
          alert("Veuillez sélectionner au moins un produit et définir une valeur de réduction.");
          return;
        }
        updatedRewardData.productIds = rewardForm.productIds;
        updatedRewardData.discountValue = parseFloat(rewardForm.discountValue);
        updatedRewardData.discountValues = rewardForm.discountValues.map(v => (v ? parseFloat(v) : 0));
      } else if (rewardForm.type === "specialOffer") {
        if (!rewardForm.specialOffer.type || !rewardForm.specialOffer.minPoints) {
          alert("Veuillez sélectionner un type d'offre spéciale et définir les points minimum.");
          return;
        }
        updatedRewardData.specialOffer = { ...rewardForm.specialOffer, minPoints: parseInt(rewardForm.specialOffer.minPoints) || 0 };
      } else if (rewardForm.type === "customOffer") {
        if (!rewardForm.customTitle || !rewardForm.customDescription) {
          alert("Veuillez entrer un titre et une description pour l'offre personnalisée.");
          return;
        }
        updatedRewardData.customOffer = {
          title: rewardForm.customTitle,
          description: rewardForm.customDescription,
          terms: rewardForm.customTerms || "",
          minPoints: parseInt(rewardForm.customMinPoints) || 0,
        };
      }

      const response = await fetch(`http://localhost:5000/api/rewards/edit/${editingReward._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(updatedRewardData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          alert(`Erreur lors de la mise à jour: ${error.message || errorText}`);
        } catch {
          alert(`Erreur lors de la mise à jour: ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log("Réponse mise à jour:", data);

      setShowEditRewardModal(false);
      setEditingReward(null);
      await fetchRewards();
    } catch (error) {
      console.error("Erreur non gérée:", error);
      alert("Une erreur s'est produite lors de la mise à jour de la récompense.");
    }
  };

 const handleDeleteReward = async (rewardId) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette récompense ?")) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/rewards/delete/${rewardId}`, {
      method: "DELETE",
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      // CORRECTION: Ajouter merchantId dans le body
      body: JSON.stringify({ merchantId: user.merchantId })
    });
    
    if (response.ok) {
      await fetchRewards();
      alert("Récompense supprimée avec succès !");
    } else {
      const errorData = await response.json();
      alert(`Erreur lors de la suppression: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    alert("Une erreur s'est produite lors de la suppression de la récompense.");
  }
};

 const [isFetchingRewards, setIsFetchingRewards] = useState(false);

const fetchRewards = useCallback(async () => {
  if (isFetchingRewards || !user?.merchantId) return;
  setIsFetchingRewards(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const response = await fetch(`http://localhost:5000/api/merchant/rewards?merchantId=${user.merchantId}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      setRewards(data.rewards || []);
    } else {
      console.error("Erreur HTTP:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des récompenses:", error);
  } finally {
    setIsFetchingRewards(false);
  }
}, [user?.merchantId, isFetchingRewards]);

const renderRewardDetails = (reward) => {
  if (reward.type === "promotion") {
    // CORRECTION: Gérer les cas où il y a plusieurs produits
    if (reward.productIds && reward.productIds.length > 0) {
      const products = reward.productIds.map((productId, index) => {
        const id = productId._id || productId;
        const productName = getProductNameById(id);
        // CORRECTION: Utiliser discountValues[index] si disponible
        const discount = reward.discountValues && reward.discountValues[index] !== undefined 
          ? reward.discountValues[index] 
          : reward.discountValue || 0;
        return `${productName} (${discount}%)`;
      }).join(', ');
      
      return (
        <div>
          <strong>Produit(s):</strong> {products}
        </div>
      );
    }
    
    // Fallback pour l'ancien format
    const productId = reward.productIds?.[0]?._id || reward.productIds?.[0];
    const productName = getProductNameById(productId);
    const discount = reward.discountValue || 0;
    return (
      <div>
        <strong>Produit:</strong> {productName}<br />
        <strong>Réduction:</strong> {discount}%
      </div>
    );
  } 
  
  else if (reward.type === "specialOffer" && reward.specialOffer) {
    if (reward.specialOffer.type === "multiplicationPoints") {
      return (
        <div>
          <strong>Type:</strong> Multiplication de points<br />
          <strong>Multiplicateur:</strong> x{reward.specialOffer.multiplier || 1}<br />
          <strong>Points minimum:</strong> {reward.specialOffer.minPoints || 0}
        </div>
      );
    } else if (reward.specialOffer.type === "buyOneGetOne") {
      return (
        <div>
          <strong>Type:</strong> Acheter 1, Obtenir 1<br />
          <strong>Acheter:</strong> {getProductNameById(reward.specialOffer.buyProductId?._id || reward.specialOffer.buyProductId)}<br />
          <strong>Obtenir:</strong> {getProductNameById(reward.specialOffer.getProductId?._id || reward.specialOffer.getProductId)}<br />
          <strong>Points minimum:</strong> {reward.specialOffer.minPoints || 0}
        </div>
      );
    }
  }
  
  else if (reward.type === "customOffer" && reward.customOffer) {
    return (
      <div>
        <strong>Titre:</strong> {reward.customOffer.title}<br />
        <strong>Description:</strong> {reward.customOffer.description}<br />
        {reward.customOffer.terms && <><strong>Conditions:</strong> {reward.customOffer.terms}<br /></>}
        <strong>Points minimum:</strong> {reward.customOffer.minPoints || 0}
      </div>
    );
  }
  
  return <div>Détails non disponibles</div>;
};

  const fetchProducts = useCallback(async () => {
  if (isFetchingProducts || !user?.merchantId) return;
  setIsFetchingProducts(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const response = await fetch(`http://localhost:5000/api/merchant/products/${user.merchantId}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products || []);
    } else {
      console.error("Erreur lors de la récupération des produits:", response.status);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  } finally {
    setIsFetchingProducts(false);
  }
}, [user?.merchantId, isFetchingProducts]); 

  const findProductByName = (productName) => products.find(product => product.name.toLowerCase() === productName.toLowerCase());

  const ProductSelector = ({ value, onChange, placeholder, required = false }) => (
    <select value={value} onChange={e => {
      const selectedProduct = products.find(p => p.name === e.target.value);
      onChange({ target: { value: selectedProduct ? selectedProduct.name : e.target.value, name: "productName" } });
      if (selectedProduct) setRewardForm(prev => ({ ...prev, productId: selectedProduct._id }));
    }} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required={required}>
      <option value="">{placeholder}</option>
      {products.map(product => <option key={product._id} value={product.name}>{product.name} - {product.price}€</option>)}
    </select>
  );

useEffect(() => {
  if (user?.merchantId) {
    fetchRewards();
    fetchProducts();
    fetchPremiumStatus();
    
  }
}, [user?.merchantId]); 

const loadRealAverages = useCallback(async () => {
  if (filteredCustomers.length === 0) return;
  
  setLoadingAverages(true);
  const amounts = {};
  const token = localStorage.getItem("token");
  const merchantId = user?.merchantId || localStorage.getItem("merchantId") || "zara";
  
  for (const customer of filteredCustomers) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/merchant/order-history?merchantId=${merchantId}&userId=${customer.userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        // Garder seulement les commandes des 6 derniers mois
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= sixMonthsAgo;
        });
        
        if (recentOrders.length > 0) {
          const total = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          amounts[customer.userId] = (total / recentOrders.length).toFixed(2);
        } else {
          amounts[customer.userId] = 0;
        }
      } else {
        amounts[customer.userId] = 0;
      }
    } catch (error) {
      console.error(`Erreur pour ${customer.userId}:`, error);
      amounts[customer.userId] = 0;
    }
  }
  
  setAverageOrderAmounts(amounts);
  setLoadingAverages(false);
}, [filteredCustomers, user, setLoadingAverages, setAverageOrderAmounts]);



// Utilisez un seul useEffect qui appelle la fonction
useEffect(() => {
  loadRealAverages();
}, [loadRealAverages]);
// 🚨 AJOUTEZ cette fonction AVANT le return de votre composant
const loadCustomerDetailData = async (customer) => {
  console.log("🚀 loadCustomerDetailData appelé avec:", customer);
  if (!customer || !user?.merchantId) {
    console.error("❌ Client ou merchantId non défini", { customer, merchantId: user?.merchantId });
    setLoadingCustomerDetail(false);
    return;
  }

  setLoadingCustomerDetail(true);
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ Aucun jeton d'authentification trouvé");
    setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
    setLoadingCustomerDetail(false);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/merchant/order-history?merchantId=${encodeURIComponent(user.merchantId)}&userId=${encodeURIComponent(customer.userId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("📦 Données reçues:", data);
      const orders = Array.isArray(data.orders) ? data.orders : [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= sixMonthsAgo;
      });

      const monthlyBreakdown = {};
      const monthlyLoyaltyPoints = {};
      recentOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1;
        monthlyLoyaltyPoints[monthKey] = (monthlyLoyaltyPoints[monthKey] || 0) + (order.loyaltyPoints || 0);
      });

      const detailData = {
        customer,
        totalOrders: recentOrders.length,
        monthlyBreakdown,
        monthlyLoyaltyPoints,
        totalAmount: recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        totalLoyaltyPoints: recentOrders.reduce((sum, order) => sum + (order.loyaltyPoints || 0), 0),
        averageOrderAmount: recentOrders.length > 0
          ? (recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / recentOrders.length).toFixed(2)
          : "0.00",
      };

      console.log("📊 Données calculées:", detailData);
      setCustomerDetailData(detailData);
    } else {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
      setError(`Erreur lors du chargement des détails du client: ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
    setError("Erreur réseau lors du chargement des détails du client.");
  } finally {
    setLoadingCustomerDetail(false);
  }
};
const fetchAverageOrderAmounts = async () => {
  if (!user?.merchantId || filteredCustomers.length === 0) {
    console.warn("⚠️ Aucun merchantId ou clients filtrés");
    setLoadingAverages(false);
    return;
  }

  setLoadingAverages(true);
  const token = localStorage.getItem("token");
  const averages = {};

  try {
    for (const customer of filteredCustomers) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/merchant/order-history?merchantId=${encodeURIComponent(user.merchantId)}&userId=${encodeURIComponent(customer.userId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const orders = Array.isArray(data.orders) ? data.orders : [];
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const recentOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= sixMonthsAgo;
          });

          averages[customer.userId] = recentOrders.length > 0
            ? recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / recentOrders.length
            : 0;
        } else {
          console.error(`❌ Erreur HTTP pour le client ${customer.userId}:`, response.status);
          averages[customer.userId] = 0;
        }
      } catch (error) {
        console.error(`❌ Erreur pour le client ${customer.userId}:`, error);
        averages[customer.userId] = 0;
      }
    }

    setAverageOrderAmounts(averages);
    console.log("✅ Montants moyens calculés:", averages);
  } catch (error) {
    console.error("❌ Erreur lors du calcul des montants moyens:", error);
    setError("Erreur lors du calcul des montants moyens.");
  } finally {
    setLoadingAverages(false);
  }
};
const handlePremiumSuccess = async (productId) => {
  // Mise à jour immédiate de l'état local
  setProducts(prevProducts => 
    prevProducts.map(p => 
      p._id === productId 
        ? { ...p, premiumAccess: true, premiumPaymentDate: new Date().toISOString() }
        : p
    )
  );
  
  // Rafraîchir le statut premium
  await fetchPremiumStatus();
  
  setMessage("✅ Premium activé avec succès !");
};

// 🚨 AJOUTEZ ce useEffect avec vos autres useEffect existants

  const toggleProfileMenu = () => setShowProfileMenu((prev) => !prev);
  const toggleNotificationMenu = () => {
    setShowNotificationMenu((prev) => !prev);
    setShowSidebarNotificationMenu(false);
  };
  const toggleSidebarNotificationMenu = () => {
    setShowSidebarNotificationMenu((prev) => !prev);
    setShowNotificationMenu(false);
  };
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleProfileOption = (option) => {
    if (option === "edit") {
      router.push("/merchant-profile");
    } else if (option === "logout") {
      logout();
      router.push("/register");
    }
    setShowProfileMenu(false);
  };

  const handleViewOrderHistory = (userId) => {
    router.push(`/merchant-dashboard/history/${userId}`);
  };

  useEffect(() => {
  if (!user || !user.merchantId) {
    setLoading(false);
    setMessage("❌ Utilisateur non authentifié ou MerchantId manquant.");
    return;
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d’authentification manquant");

      const queryParams = new URLSearchParams({
        merchantId: user.merchantId,
        ...(filters.minPoints && { minPoints: filters.minPoints }),
        ...(filters.minOrders && { minOrders: filters.minOrders }),
        ...(filters.lastVisit && { lastVisit: filters.lastVisit }),
        ...(filters.status && { status: filters.status }), // Nouveau filtre Statut
        ...(filters.loyaltyLevel && { loyaltyLevel: filters.loyaltyLevel }), // Nouveau filtre Points
        ...(filters.minFrequency && { minFrequency: filters.minFrequency }), // Nouveau filtre Fréquence
        ...(filters.lastOrderDate && { lastOrderDate: filters.lastOrderDate }), // Nouveau filtre Date
      }).toString();

      const customersRes = await fetch(
        `http://192.168.43.57:5000/api/merchant/loyal-customers?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!customersRes.ok) {
        const errorData = await customersRes.json();
        throw new Error(errorData.message || "Erreur lors de la récupération des clients");
      }

      const customersData = await customersRes.json();
      const uniqueCustomers = Array.from(
        new Map(customersData.customers.map((customer) => [customer.userId, customer])).values()
      );
      setLoyalCustomers(uniqueCustomers);
      setFilteredCustomers(applyFilters(uniqueCustomers));
      setStats(customersData.stats || { totalCustomers: 0, totalPoints: 0, averagePoints: 0 });

      const productsRes = await fetch("http://192.168.43.57:5000/api/merchant/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!productsRes.ok) {
        const errorData = await productsRes.json();
        throw new Error(errorData.message || "Erreur lors de la récupération des produits");
      }
      const productsData = (await productsRes.json()).products || [];
      setProducts(productsData);

      if (activeSection === "all") {
        await fetchMerchantStats();
        
        await fetchRecentOrders();
      }
      if (activeSection === "all" && (activeSubSection === "analytics" || activeSubSection === "marketing")) {
        console.log("Appel analytics avec merchantId:", selectedShopId || user.merchantId);
        await fetchAnalyticsData(selectedShopId || user.merchantId, period);
        console.log("Valeur de analytics après fetch:", analytics);
      }

      // Mise à jour initiale des segments
      updateSegments();
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  fetchNotifications();

  let cleanupLocation = null;
  if (activeSection === "stock") {
    cleanupLocation = getLocation();
  }

  return () => {
    if (cleanupLocation && typeof cleanupLocation === "function") {
      cleanupLocation();
    }
  };
}, [user, filters, activeSection, activeSubSection, selectedShopId, period, compareStartMonth, compareEndMonth]);
  useEffect(() => {
    setFilteredCustomers(applyFilters(loyalCustomers));
  }, [searchTerm, loyalCustomers]);

  if (!user || user.role !== "marchand") {
    return <div className="text-center p-6">Accès réservé aux marchands !</div>;
  }

  const { Component: ChartComponent, data: chartDataConfig, options: chartOptionsConfig } = getSubSectionChart();

  return (
    <div className="min-h-screen flex">
  <div
    className={`bg-slate-800 text-white transition-all duration-300 ${
      isSidebarOpen ? "w-64" : "w-16"
    } min-h-screen fixed flex flex-col border-r-4 border-amber-500`}
    style={{
      background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
      boxShadow: '4px 0 15px rgba(0,0,0,0.3)'
    }}
  >
    <div className="p-4 flex justify-between items-center border-b-2 border-amber-500">
      {isSidebarOpen && <h1 className="text-xl font-bold text-amber-400">🏝️ Île du Gardien</h1>}
      <button onClick={toggleSidebar} className="text-white hover:text-amber-400">
        <FaBars className="h-6 w-6" />
      </button>
    </div>
        <nav className="flex-1">
  <ul className="space-y-2 mt-4">
    <li>
      <button
        onClick={() => {
          setActiveSection("all");
          setActiveSubSection("ecommerce");
          setIsOverviewOpen(!isOverviewOpen);
        }}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "all" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaMap className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && (
          <span className="flex justify-between w-full items-center">
             Carte de l'Île
            <span>{isOverviewOpen ? "▲" : "▼"}</span>
          </span>
        )}
      </button>

      {activeSection === "all" && isSidebarOpen && isOverviewOpen && (
        <ul className="ml-6 space-y-1 mt-1">
          <li>
            <button
              onClick={() => setActiveSubSection("ecommerce")}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "ecommerce" ? "bg-slate-600" : ""
              }`}
            >
              <FaStore className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Commerce</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                console.log("Changement vers sous-section analytics");
                setActiveSection("all");
                setActiveSubSection("analytics");
                setIsOverviewOpen(true);
              }}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "analytics" ? "bg-slate-600" : ""
              }`}
            >
              <FaChartLine className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Rapports de Navigation</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSubSection("marketing")}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "marketing" ? "bg-slate-600" : ""
              }`}
            >
              <FaBullhorn className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Expéditions</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSubSection("crm")}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "crm" ? "bg-slate-600" : ""
              }`}
            >
              <FaAddressBook className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Journal des Aventuriers</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSubSection("stocks")}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "stocks" ? "bg-slate-600" : ""
              }`}
            >
              <FaWarehouse className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Réserves de l'Île</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSubSection("saas")}
              className={`w-full flex items-center p-2 hover:bg-slate-600 rounded ${
                activeSubSection === "saas" ? "bg-slate-600" : ""
              }`}
            >
              <FaCloud className="h-4 w-4 mr-2 text-amber-400" />
              {isSidebarOpen && <span> Services</span>}
            </button>
          </li>
        </ul>
      )}
    </li>
    <li>
      <button
        onClick={() => setActiveSection("clients")}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "clients" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaUsers className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Aventuriers</span>}
      </button>
    </li>
    <li>
      <button
        onClick={() => setActiveSection("calendrier")}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "calendrier" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaCalendarAlt className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Calendrier des Marées</span>}
      </button>
    </li>
    <li>
      <button
        onClick={() => setActiveSection("points")}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "points" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaCoins className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Pièces d'Or</span>}
      </button>
    </li>
    <li>
      <button
        onClick={() => setActiveSection("rewards")}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "rewards" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaTrophy className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Trésors de l'Île</span>}
      </button>
    </li>
    <li>
      <button
        onClick={() => setActiveSection("stock")}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === "stock" ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaBox className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Provisions</span>}
      </button>
    </li>
    <li>
      <button
        onClick={toggleSidebarNotificationMenu}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          showSidebarNotificationMenu ? "bg-slate-700 border-l-4 border-amber-500" : ""
        }`}
      >
        <FaBell className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Messages du Capitaine</span>}
        {notifications.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
            {notifications.length}
          </span>
        )}
      </button>
      {showSidebarNotificationMenu && (
        <div className="absolute left-64 mt-[-160px] w-64 bg-white text-black rounded-md shadow-lg p-4 z-10 border-2 border-amber-500">
          <h3 className="text-lg font-semibold mb-2">📜 Messages du Capitaine</h3>
          {notifications.length > 0 ? (
            <ul className="space-y-2">
              {notifications.map((notif, index) => (
                <li
                  key={index}
                  className={`p-2 rounded ${notif.read ? "bg-gray-100" : "bg-amber-100"}`}
                >
                  {notif.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucun message du capitaine pour le moment.</p>
          )}
        </div>
      )}
    </li>
    <li>
      <button
        onClick={() => setActiveSection('messages')}
        className={`w-full flex items-center p-4 hover:bg-slate-700 hover:border-l-4 hover:border-amber-500 transition-all ${
          activeSection === 'messages' ? 'bg-slate-700 border-l-4 border-amber-500' : ''
        }`}
      >
        <FaEnvelope className="h-6 w-6 mr-3 text-amber-400" />
        {isSidebarOpen && <span> Courrier</span>}
      </button>
    </li>
  </ul>
</nav>
      </div>

      <div className={`flex-1 flex flex-col ${isSidebarOpen ? "ml-64" : "ml-16"}`}>
  <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 flex justify-between items-center shadow-lg border-b-4 border-amber-500">
    <h1 className="text-xl font-bold text-amber-400">
      🏝️ Bienvenue sur votre Île, Gardien {user && user.nom ? user.nom : "Inconnu"} !
    </h1>
    <div className="flex items-center space-x-4">
      <div className="relative">
        <button
          onClick={toggleProfileMenu}
          className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-full hover:bg-amber-700 transition-colors border-2 border-amber-400"
        >
          <div className="w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center text-sm font-bold">
            {(user && user.nom ? user.nom.charAt(0) : "G").toUpperCase()}
          </div>
          <span className="hidden sm:block">🏝️ {user?.nom}</span>
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10 border-2 border-amber-500">
            <ul className="py-2">
              <li
                className="px-4 py-2 hover:bg-amber-100 cursor-pointer"
                onClick={() => handleProfileOption("edit")}
              >
                ⚙️ Modifier Profil
              </li>
              <li
                className="px-4 py-2 hover:bg-amber-100 cursor-pointer"
                onClick={() => handleProfileOption("logout")}
              >
                🚪 Quitter l'Île
        </li>
      </ul>
    </div>
  )}
</div>

          </div>
        </div>

       <div className="container mx-auto p-6 flex-1">
  {activeSection === "all" && (
    <div>
      {activeSubSection === "ecommerce" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
            {/* Carte au trésor - Revenus */}
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg shadow-lg flex items-center" style={{backgroundImage: "url('texture-parchemin.png')", backgroundSize: "cover"}}>
              <span className="text-2xl mr-4">💰</span>
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Butin total</h2>
                <p className="text-2xl font-bold text-amber-600">{merchantStats?.[0]?.revenue?.toFixed(2) || "0.00"} pièces d'or</p>
                <p className={`text-sm ${merchantStats?.[0]?.revenueChange >= 0 ? "text-emerald-600" : "text-ruby-600"}`}>
                  {merchantStats?.[0]?.revenueChange !== undefined
                    ? `${merchantStats[0].revenueChange.toFixed(1)}%`
                    : "N/A"} 
                  {merchantStats?.[0]?.revenueChange >= 0 ? "↗ plus que" : "↘ moins que"} la dernière lune
                </p>
              </div>
            </div>

            {/* Expéditions - Commandes */}
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg shadow-lg flex items-center" style={{backgroundImage: "url('texture-parchemin.png')", backgroundSize: "cover"}}>
              <span className="text-2xl mr-4">⚓</span>
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Expéditions lancées</h2>
                <p className="text-2xl font-bold text-amber-600">{merchantStats?.[0]?.orders || 0}</p>
                <p className={`text-sm ${merchantStats?.[0]?.ordersChange >= 0 ? "text-emerald-600" : "text-ruby-600"}`}>
                  {merchantStats?.[0]?.ordersChange !== undefined
                    ? `${merchantStats[0].ordersChange.toFixed(1)}%`
                    : "N/A"} 
                  {merchantStats?.[0]?.ordersChange >= 0 ? "↗ plus que" : "↘ moins que"} la dernière lune
                </p>
              </div>
            </div>

            {/* Aventuriers - Clients */}
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg shadow-lg flex items-center" style={{backgroundImage: "url('texture-parchemin.png')", backgroundSize: "cover"}}>
              <span className="text-2xl mr-4">🏴‍☠️</span>
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Aventuriers en quête</h2>
                <p className="text-2xl font-bold text-amber-600">{merchantStats?.[0]?.activeCustomers || 0}</p>
                <p className={`text-sm ${merchantStats?.[0]?.customersChange >= 0 ? "text-emerald-600" : "text-ruby-600"}`}>
                  {merchantStats?.[0]?.customersChange !== undefined
                    ? `${merchantStats[0].customersChange.toFixed(1)}%`
                    : "N/A"} 
                  {merchantStats?.[0]?.customersChange >= 0 ? "↗ plus que" : "↘ moins que"} la dernière lune
                </p>
              </div>
            </div>

            {/* Trésors - Produits */}
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg shadow-lg flex items-center" style={{backgroundImage: "url('texture-parchemin.png')", backgroundSize: "cover"}}>
              <span className="text-2xl mr-4">🏆</span>
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Trésors trouvés</h2>
                <p className="text-2xl font-bold text-amber-600">{merchantStats?.[0]?.productsSold || 0}</p>
                <p className={`text-sm ${merchantStats?.[0]?.productsChange >= 0 ? "text-emerald-600" : "text-ruby-600"}`}>
                  {merchantStats?.[0]?.productsChange !== undefined
                    ? `${merchantStats[0].productsChange.toFixed(1)}%`
                    : "N/A"} 
                  {merchantStats?.[0]?.productsChange >= 0 ? "↗ plus que" : "↘ moins que"} la dernière lune
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-amber-800 border-b-2 border-amber-200 pb-2">
              📜 Journal des Expéditions
            </h2>
            
            <div className="flex space-x-4 mb-4">
              <div>
                <label className="mr-2 text-amber-800">Lune de référence :</label>
                <select
                  value={compareStartMonth}
                  onChange={(e) => setCompareStartMonth(e.target.value)}
                  className="p-2 border border-amber-300 rounded bg-amber-50 text-amber-800"
                >
                   <option value="">Par défaut (mois précédent)</option>
                          <option value="2025-01">Janvier 2025</option>
                          <option value="2025-02">Février 2025</option>
                          <option value="2025-03">Mars 2025</option>
                          <option value="2025-04">Avril 2025</option>
                          <option value="2025-05">Mai 2025</option>
                </select>
              </div>
              <div>
                <label className="mr-2 text-amber-800">Lune cible :</label>
                <select
                  value={compareEndMonth}
                  onChange={(e) => setCompareEndMonth(e.target.value)}
                  className="p-2 border border-amber-300 rounded bg-amber-50 text-amber-800"
                >
                   <option value="">Par défaut (mois en cours)</option>
                          <option value="2025-02">Février 2025</option>
                          <option value="2025-03">Mars 2025</option>
                          <option value="2025-04">Avril 2025</option>
                          <option value="2025-05">Mai 2025</option>
                          <option value="2025-06">Juin 2025</option>
                </select>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-md shadow-lg border-2 border-amber-200">
              {ChartComponent && merchantStats?.[0]?.monthlyStats && (
                <div className="max-w-full">
                  <ChartComponent data={chartDataConfig} options={chartOptionsConfig} />
                </div>
              )}

              {activeSubSection === "ecommerce" && demographicData && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-amber-800">Origine des Aventuriers</h3>
                  
                  <div className="flex flex-col md:flex-row items-start justify-between">
                    <div className="w-full md:w-2/3 mb-4 md:mb-0">
                      <DemographicMap
                        demographicData={demographicData.data.filter((d) => d.country !== "Inconnu")}
                        setMessage={setMessage}
                      />
                    </div>
                    <div className="w-full md:w-1/3 pl-0 md:pl-4">
                      {demographicData.data.length > 0 ? (
                        demographicData.data
                          .filter((d) => d.country !== "Inconnu")
                          .sort((a, b) => b.count - a.count)
                          .map((country, index) => (
                            <div key={index} className="flex items-center justify-between mb-2">
                              {/* Contenu inchangé mais stylisé différemment */}
                            </div>
                          ))
                      ) : (
                        <p className="text-amber-700">Aucune trace d'aventuriers sur la carte.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSubSection === "ecommerce" && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-amber-800">Dernières Expéditions</h3>
                  {recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-amber-100">
                            <th className="p-3 text-sm font-semibold text-amber-800">Rouleau d'Expédition</th>
                            <th className="p-3 text-sm font-semibold text-amber-800">Date</th>
                            <th className="p-3 text-sm font-semibold text-amber-800">Aventurier</th>
                            <th className="p-3 text-sm font-semibold text-amber-800">Butin</th>
                            
                            <th className="p-3 text-sm font-semibold text-amber-800">Trésors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order._id} className="border-t border-amber-200">
                              <td className="p-3 text-sm text-amber-700">{order._id.toString().slice(-6)}</td>
                              <td className="p-3 text-sm text-amber-700">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-sm text-amber-700">
                                {`${order.shippingAddress?.firstName || "Inconnu"} ${
                                  order.shippingAddress?.lastName || ""
                                }`}
                              </td>
                              
                              <td className="p-3 text-sm text-amber-700">
                                {order.items && order.items.length > 0 ? (
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr>
                                        <th className="text-xs font-semibold text-amber-700">Emblème</th>
                                        <th className="text-xs font-semibold text-amber-700">Type</th>
                                        <th className="text-xs font-semibold text-amber-700">Valeur</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item, index) => (
                                        <tr key={index} className="border-t border-amber-100">
                                          <td className="text-xs">
                                            {item.productId?.imageUrl ? (
                                              <img
                                                src={item.productId.imageUrl}
                                                alt={item.productId.name}
                                                className="w-10 h-10 object-cover rounded"
                                                onError={(e) =>
                                                  console.log("Erreur chargement image:", item.productId.imageUrl)
                                                }
                                              />
                                            ) : (
                                              <span className="text-amber-600">Pas d'emblème</span>
                                            )}
                                          </td>
                                          <td className="text-xs text-amber-700">{item.productId?.category || "Mystérieux"}</td>
                                          <td className="text-xs text-amber-700">{item.productId?.price.toFixed(2)} pièces d'or</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <span className="text-amber-600">Aucun trésor</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-amber-700">Aucune expédition récente dans les annales.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

              {activeSection === "all" && activeSubSection === "analytics" && (
                <div className="bg-white p-4 rounded-md shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Analytics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-100 rounded-lg text-center">
                      <h3 className="text-lg font-semibold">Unique Visitors</h3>
                      <p className="text-2xl">{analytics.uniqueVisitors || 0}</p>
                      <p className="text-sm text-green-600">+5% Vs last month</p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-lg text-center">
                      <h3 className="text-lg font-semibold">Total Pageviews</h3>
                      <p className="text-2xl">{analytics.totalPageviews || 0}</p>
                      <p className="text-sm text-green-600">+2% Vs last month</p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-lg text-center">
                      <h3 className="text-lg font-semibold">Visit Duration</h3>
                      <p className="text-2xl">
                        {Math.floor((analytics.visitDuration || 0) / 60)}m {(analytics.visitDuration || 0) % 60}s
                      </p>
                      <p className="text-sm text-green-600">+3% Vs last month</p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-lg text-center">
                      <h3 className="text-lg font-semibold">Bounce Rate</h3>
                      <p className="text-2xl">50%</p>
                      <p className="text-sm text-red-600">-1.5% Vs last month</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Visitor Analytics (Last 30 Days)</h3>
                      <div style={{ width: "100%", height: "300px" }}>
                        {analytics.dailyVisitors ? (
                          <Bar
                            data={{
                              labels: analytics.dailyVisitors.map((d) => d.date),
                              datasets: [
                                {
                                  label: "Unique Visitors",
                                  data: analytics.dailyVisitors.map((d) => d.uniqueVisitors),
                                  backgroundColor: "rgba(59, 130, 246, 0.6)",
                                  borderColor: "rgba(59, 130, 246, 1)",
                                  borderWidth: 1,
                                },
                                {
                                  label: "Pageviews",
                                  data: analytics.dailyVisitors.map((d) => d.totalPageviews),
                                  backgroundColor: "rgba(255, 99, 132, 0.6)",
                                  borderColor: "rgba(255, 99, 132, 1)",
                                  borderWidth: 1,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              scales: {
                                y: { beginAtZero: true, title: { display: true, text: "Count" } },
                                x: { title: { display: true, text: "Date" } },
                              },
                              plugins: {
                                legend: { display: true },
                                title: { display: true, text: "Visitor Analytics (Last 30 Days)" },
                              },
                            }}
                          />
                        ) : (
                          <p>Chargement des données quotidiennes...</p>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Top Pages</h3>
                      <div className="p-4 bg-gray-100 rounded-md">
                        {analytics.topPages && analytics.topPages.length > 0 ? (
                          <div>
                            {analytics.topPages.map((page, index) => (
                              <div key={index} className="flex justify-between py-2 border-b">
                                <span className="text-gray-700">{page.source}</span>
                                <span className="text-gray-900 font-medium">{page.pageviews.toLocaleString()}K</span>
                              </div>
                            ))}
                            <a href="#" className="mt-4 inline-block text-blue-600 hover:underline">
                              Channels Report →
                            </a>
                          </div>
                        ) : (
                          <p>Aucune donnée de top pages disponible.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>{console.log("Rendu analytics:", analytics)}</div>
                </div>
              )}



{activeSection === "all" && activeSubSection === "marketing" && analytics.reviewsMetrics ? (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Marketing</h2>
      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>

    {/* Time Period Selector */}
    <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-8 inline-flex">
      <button
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          period === "monthly" 
            ? "text-gray-900 bg-white shadow-sm" 
            : "text-gray-600 hover:bg-white hover:shadow-sm"
        }`}
        onClick={() => setPeriod("monthly")}
      >
        Monthly
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          period === "quarterly" 
            ? "text-gray-900 bg-white shadow-sm" 
            : "text-gray-600 hover:bg-white hover:shadow-sm"
        }`}
        onClick={() => setPeriod("quarterly")}
      >
        Quarterly
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          period === "annually" 
            ? "text-gray-900 bg-white shadow-sm" 
            : "text-gray-600 hover:bg-white hover:shadow-sm"
        }`}
        onClick={() => setPeriod("annually")}
      >
        Annually
      </button>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Première colonne - Métriques d'avis */}
      <div className="xl:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Note Moyenne des Clients */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="mb-1">
              <p className="text-gray-500 text-sm font-medium">Note Moyenne des Clients</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-gray-900">
                {(analytics.reviewsMetrics?.averageRating || 0).toFixed(1)}/10
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-green-500 text-sm font-medium">+20%</span>
                <span className="text-gray-400 text-sm">Vs last month</span>
              </div>
            </div>
          </div>

          {/* Taux d'Avis Positifs */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-1">
              <p className="text-gray-500 text-sm font-medium">Taux d'Avis Positifs</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-gray-900">
                {(analytics.reviewsMetrics?.positiveRate || 0).toFixed(0)}%
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-red-500 text-sm font-medium">-3.59%</span>
                <span className="text-gray-400 text-sm">Vs last month</span>
              </div>
            </div>
          </div>

          {/* Taux d'Avis Négatifs */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-1">
              <p className="text-gray-500 text-sm font-medium">Taux d'Avis Négatifs</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-gray-900">
                {(analytics.reviewsMetrics?.negativeRate || 0).toFixed(0)}%
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-green-500 text-sm font-medium">+15%</span>
                <span className="text-gray-400 text-sm">Vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nouvelles métriques avec mini charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Subscribers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">New Subscribers</h3>
              <div className="w-24 h-8 flex items-end justify-end">
                <svg width="96" height="32" viewBox="0 0 96 32" className="overflow-visible">
                  <path
                    d="M0,20 Q12,18 24,16 Q36,14 48,12 Q60,10 72,8 Q84,6 96,4"
                    stroke="#10B981"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-sm"
                  />
                  <path
                    d="M0,20 Q12,18 24,16 Q36,14 48,12 Q60,10 72,8 Q84,6 96,4 L96,32 L0,32 Z"
                    fill="url(#gradient1)"
                    opacity="0.3"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {(analytics.reviewsMetrics?.newSubscribers || 567).toLocaleString()}K
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  Number(analytics.reviewsMetrics?.newSubscribersChange) >= 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}>
                  {typeof analytics.reviewsMetrics?.newSubscribersChange === "number"
                    ? `${analytics.reviewsMetrics.newSubscribersChange >= 0 ? '+' : ''}${analytics.reviewsMetrics.newSubscribersChange.toFixed(2)}%`
                    : "+3.85%"}
                </span>
                <span className="text-gray-500 text-sm">then last Week</span>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Conversion Rate</h3>
              <div className="w-24 h-8 flex items-end justify-end">
                <svg width="96" height="32" viewBox="0 0 96 32" className="overflow-visible">
                  <path
                    d="M0,12 Q12,14 24,16 Q36,18 48,20 Q60,22 72,24 Q84,26 96,28"
                    stroke="#10B981"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-sm"
                  />
                  <path
                    d="M0,12 Q12,14 24,16 Q36,18 48,20 Q60,22 72,24 Q84,26 96,28 L96,32 L0,32 Z"
                    fill="url(#gradient2)"
                    opacity="0.3"
                  />
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {(analytics.reviewsMetrics?.conversionRate || 276).toLocaleString()}K
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  (analytics.reviewsMetrics?.conversionRateLastWeek || 0) >=
                  (analytics.reviewsMetrics?.conversionRate || 0)
                    ? "text-green-600"
                    : "text-red-500"
                }`}>
                  {typeof analytics.reviewsMetrics?.conversionRateLastWeek === "number" &&
                  typeof analytics.reviewsMetrics?.conversionRate === "number" &&
                  analytics.reviewsMetrics.conversionRate !== 0
                    ? `${(
                        ((analytics.reviewsMetrics.conversionRateLastWeek -
                          analytics.reviewsMetrics.conversionRate) /
                          analytics.reviewsMetrics.conversionRate) *
                        100
                      ).toFixed(2)}%`
                    : "-5.39%"}
                </span>
                <span className="text-gray-500 text-sm">then last Week</span>
              </div>
            </div>
          </div>

          {/* Page Bounce Rate */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Page Bounce Rate</h3>
              <div className="w-24 h-8 flex items-end justify-end">
                <svg width="96" height="32" viewBox="0 0 96 32" className="overflow-visible">
                  <path
                    d="M0,20 Q12,18 24,16 Q36,14 48,12 Q60,10 72,8 Q84,6 96,4"
                    stroke="#10B981"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-sm"
                  />
                  <path
                    d="M0,20 Q12,18 24,16 Q36,14 48,12 Q60,10 72,8 Q84,6 96,4 L96,32 L0,32 Z"
                    fill="url(#gradient3)"
                    opacity="0.3"
                  />
                  <defs>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {analytics.reviewsMetrics?.bounceRate
                  ? parseInt(analytics.reviewsMetrics.bounceRate)
                  : 285}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  analytics.reviewsMetrics?.bounceRateLastWeek != null &&
                  analytics.reviewsMetrics.bounceRateLastWeek <=
                    (parseInt(analytics.reviewsMetrics?.bounceRate) || 0)
                    ? "text-green-600"
                    : "text-red-500"
                }`}>
                  {analytics.reviewsMetrics?.bounceRateLastWeek != null
                    ? `${(
                        ((parseInt(analytics.reviewsMetrics.bounceRateLastWeek) -
                          parseInt(analytics.reviewsMetrics?.bounceRate || 0)) /
                          parseInt(analytics.reviewsMetrics?.bounceRate || 1)) *
                        100
                      ).toFixed(2)}%`
                    : "+12.74%"}
                </span>
                <span className="text-gray-500 text-sm">then last Week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nouvelle section : Produits les plus commentés */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits les plus commentés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Produit le plus apprécié */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="ml-3 text-sm font-medium text-gray-600">Produit le plus apprécié</h4>
              </div>
              {
                (() => {
                  const productReviews = analytics.reviewsMetrics?.customerReviews?.filter(
                    review => review.targetType === 'Product' && review.isProductReview
                  ) || [];
                  const reviewsByProduct = productReviews.reduce((acc, review) => {
                    const productName = review.productName || 'Produit inconnu';
                    if (!acc[productName]) acc[productName] = { positive: 0 };
                    if (review.sentiment === 'positif') acc[productName].positive += 1;
                    return acc;
                  }, {});
                  const topPositive = Object.entries(reviewsByProduct).reduce(
                    (top, [name, counts]) => counts.positive > top.count ? { name, count: counts.positive } : top,
                    { name: null, count: 0 }
                  );
                  return topPositive.name ? (
                    <div>
                      <p className="text-lg font-bold text-gray-900">{topPositive.name}</p>
                      <p className="text-sm text-gray-500">{topPositive.count} avis positifs</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun avis positif sur les produits.</p>
                  );
                })()
              }
            </div>

            {/* Produit à améliorer */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="ml-3 text-sm font-medium text-gray-600">Produit à améliorer</h4>
              </div>
              {
                (() => {
                  const productReviews = analytics.reviewsMetrics?.customerReviews?.filter(
                    review => review.targetType === 'Product' && review.isProductReview
                  ) || [];
                  const reviewsByProduct = productReviews.reduce((acc, review) => {
                    const productName = review.productName || 'Produit inconnu';
                    if (!acc[productName]) acc[productName] = { negative: 0 };
                    if (review.sentiment === 'négatif') acc[productName].negative += 1;
                    return acc;
                  }, {});
                  const topNegative = Object.entries(reviewsByProduct).reduce(
                    (top, [name, counts]) => counts.negative > top.count ? { name, count: counts.negative } : top,
                    { name: null, count: 0 }
                  );
                  return topNegative.name ? (
                    <div>
                      <p className="text-lg font-bold text-gray-900">{topNegative.name}</p>
                      <p className="text-sm text-gray-500">{topNegative.count} avis négatifs</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun avis négatif sur les produits.</p>
                  );
                })()
              }
            </div>
          </div>
        </div>
      </div>

      {/* Section Commentaires Clients */}
      <div className="xl:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Commentaires Clients</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {analytics.reviewsMetrics?.customerReviews?.length || 0} avis
              </span>
            </div>
          </div>

          {/* Filtres par sentiment */}
          <div className="flex space-x-2 mb-4">
            <button className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Positif ({analytics.reviewsMetrics?.customerReviews?.filter(r => r.sentiment === 'positif')?.length || 0})
            </button>
            <button className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              Neutre ({analytics.reviewsMetrics?.customerReviews?.filter(r => r.sentiment === 'neutre')?.length || 0})
            </button>
            <button className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Négatif ({analytics.reviewsMetrics?.customerReviews?.filter(r => r.sentiment === 'négatif')?.length || 0})
            </button>
          </div>

          {/* Liste des commentaires */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.reviewsMetrics?.customerReviews?.slice(0, 10).map((review, index) => (
              <div key={review._id || index} className="border-l-4 border-gray-200 pl-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      review.sentiment === 'positif' ? 'bg-green-500' :
                      review.sentiment === 'négatif' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.targetType === 'Shop' ? 'Boutique' : 'Produit'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {review.value && Array.from({length: 5}, (_, i) => (
                      <svg key={i} className={`w-3 h-3 ${
                        i < review.value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    review.sentiment === 'positif' ? 'bg-green-100 text-green-700' :
                    review.sentiment === 'négatif' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.sentiment}
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 text-sm">Aucun commentaire disponible</p>
              </div>
            )}
          </div>

          {/* Bouton voir plus */}
          {analytics.reviewsMetrics?.customerReviews?.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Voir plus de commentaires ({analytics.reviewsMetrics.customerReviews.length - 10} restants)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {console.log("Rendu analytics (Marketing):", analytics)}
  </div>
) : (
  <p></p>
)}



{activeSubSection === "crm" && (
  <div className="bg-white p-4 rounded-md shadow-md">
    <h2 className="text-xl font-semibold mb-4">CRM</h2>

    {/* Métriques en temps réel - mises à jour pour les 6 derniers mois (déplacées en haut) */}
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <h3 className="text-lg font-semibold">👥 Clients dans le segment</h3>
        <p className="text-2xl">{filteredCustomers.length}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <h3 className="text-lg font-semibold">⭐ Points moyens</h3>
        <p className="text-2xl">{filteredCustomers.length > 0 ? (filteredCustomers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) / filteredCustomers.length).toFixed(0) : 0}</p>
      </div>
      <div className="bg-blue-100 p-4 rounded-lg text-center">
        <h3 className="text-lg font-semibold">📅 Fréquence moy. (6 mois)</h3>
        <p className="text-2xl">{filteredCustomers.length > 0 ? (filteredCustomers.reduce((sum, c) => {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          if (c.lastOrderDate) {
            const lastOrderDate = new Date(c.lastOrderDate);
            if (lastOrderDate >= sixMonthsAgo) {
              return sum + (c.orderCount || 0);
            } else {
              return sum + 0;
            }
          }
          
          if (c.orderCount > 0) {
            return sum + (c.orderCount || 0);
          }
          
          return sum + (c.orderCountLast6Months || c.orderCount6Months || 0);
        }, 0) / filteredCustomers.length).toFixed(1) : 0}</p>
      </div>
      
      <div className="bg-green-100 p-4 rounded-lg text-center">
        <h3 className="text-lg font-semibold">✅ Clients actifs (6 mois)</h3>
        <p className="text-2xl">{filteredCustomers.filter(c => {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          if (c.lastOrderDate) {
            const lastOrderDate = new Date(c.lastOrderDate);
            return lastOrderDate >= sixMonthsAgo;
          }
          
          if (c.orderCount > 0) {
            return true;
          }
          
          return (c.orderCountLast6Months || c.orderCount6Months || 0) > 0;
        }).length}</p>
      </div>
    </div>

    {/* Message d'information en cas d'erreur ou de données vides */}
    {filteredCustomers.length === 0 && (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
        <p className="text-yellow-800">Aucune donnée disponible ou erreur lors du chargement. Vérifiez votre connexion ou le jeton d'authentification.</p>
      </div>
    )}

    {/* Première ligne de graphiques - 3 graphiques */}
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      
      {/* 1. Fréquence des commandes par client et boutique (6 derniers mois) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Fréquence des Commandes par Client (6 derniers mois)
          <span className="text-sm text-gray-500 ml-2">📊 Cliquez sur une barre pour plus de détails</span>
        </h3>
        <div className="h-64">
          <Bar 
            data={{
              labels: filteredCustomers.map(customer => `${customer.nom || `Client ${customer.userId}`} - ${customer.shopId || 'Inconnu'}`),
              datasets: [
                {
                  label: "Commandes (6 derniers mois)",
                  data: filteredCustomers.map(customer => {
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                    
                    if (customer.lastOrderDate) {
                      const lastOrderDate = new Date(customer.lastOrderDate);
                      if (lastOrderDate >= sixMonthsAgo) {
                        return customer.orderCount || 0;
                      } else {
                        return 0;
                      }
                    }
                    
                    if (customer.orderCount > 0) {
                      return customer.orderCount;
                    }
                    
                    return customer.orderCountLast6Months || customer.orderCount6Months || 0;
                  }),
                  backgroundColor: "#4BC0C0",
                  borderColor: "#369999",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onClick: (event, elements) => {
                console.log("🎯 Clic détecté sur le graphique !");
                console.log("📊 Elements cliqués:", elements);
                
                if (elements.length > 0) {
                  const clickedIndex = elements[0].index;
                  console.log("📍 Index cliqué:", clickedIndex);
                  
                  const customer = filteredCustomers[clickedIndex];
                  console.log("👤 Client sélectionné:", customer);
                  
                  // Vérifiez si les fonctions existent
                  console.log("🔧 setSelectedCustomer existe ?", typeof setSelectedCustomer);
                  console.log("🔧 loadCustomerDetailData existe ?", typeof loadCustomerDetailData);
                  
                  if (typeof setSelectedCustomer === 'function') {
                    setSelectedCustomer(customer);
                    console.log("✅ setSelectedCustomer appelé");
                  } else {
                    console.error("❌ setSelectedCustomer n'est pas défini !");
                  }
                  
                  if (typeof loadCustomerDetailData === 'function') {
                    loadCustomerDetailData(customer);
                    console.log("✅ loadCustomerDetailData appelé");
                  } else {
                    console.error("❌ loadCustomerDetailData n'est pas défini !");
                  }
                } else {
                  console.log("⚠️ Aucun élément cliqué détecté");
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: "Nombre de commandes par client sur les 6 derniers mois"
                },
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const frequency = context.parsed.y;
                      const avgPerMonth = (frequency / 6).toFixed(1);
                      return `${frequency} commandes (${avgPerMonth}/mois en moyenne)`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Nombre de commandes"
                  },
                  ticks: {
                    stepSize: 1
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: "Client - Boutique"
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                }
              }
            }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>📊 Période d'analyse : {new Date(new Date().setMonth(new Date().getMonth() - 6)).toLocaleDateString('fr-FR')} - {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* 2. Montant moyen par commande par client et boutique (6 derniers mois) - CORRIGÉ */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Montant Moyen par Commande (6 derniers mois)
          {loadingAverages && <span className="ml-2 text-sm text-blue-500">⏳ Chargement...</span>}
        </h3>
        <div className="h-64">
          <Bar 
            data={{
              labels: filteredCustomers.map(customer => `${customer.nom || `Client ${customer.userId}`} - ${customer.shopId || 'Inconnu'}`),
              datasets: [
                {
                  label: "Montant moyen (DT)",
                  data: filteredCustomers.map(customer => averageOrderAmounts[customer.userId] || 0),
                  backgroundColor: "#FF9F40",
                  borderColor: "#FF8C1A",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: "Montant moyen réel dépensé par commande sur les 6 derniers mois"
                },
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const amount = parseFloat(context.parsed.y);
                      return `Montant moyen: ${amount.toFixed(2)} DT par commande`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Montant moyen (DT)"
                  },
                  ticks: {
                    callback: function(value) {
                      return value.toFixed(2) + ' DT';
                    }
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: "Client - Boutique"
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                }
              }
            }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>💰 Période d'analyse : {new Date(new Date().setMonth(new Date().getMonth() - 6)).toLocaleDateString('fr-FR')} - {new Date().toLocaleDateString('fr-FR')}</p>
          <p>📊 Calcul basé sur l'historique réel des commandes de chaque client</p>
          {!loadingAverages && Object.keys(averageOrderAmounts).length > 0 && (
            <p className="text-green-600">✅ Données mises à jour depuis l'historique réel</p>
          )}
        </div>
      </div>

      {/* 3. Graphique doughnut - Statut des clients */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Statut des Clients</h3>
        <div className="h-64 flex items-center justify-center">
          <Doughnut 
            data={{
              labels: ["Engagés", "À Risque", "Désengagés"],
              datasets: [
                {
                  data: [
                    filteredCustomers.filter((c) => c.status === "Engaged").length,
                    filteredCustomers.filter((c) => c.status === "AtRisk").length,
                    filteredCustomers.filter((c) => c.status === "Disengaged").length,
                  ],
                  backgroundColor: ["#4BC0C0", "#FF9F40", "#FF6384"],
                  borderWidth: 2,
                  borderColor: "#fff"
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                title: { 
                  display: true, 
                  text: "Répartition par statut d'engagement" 
                },
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((context.parsed * 100) / total).toFixed(1);
                      return `${context.label}: ${context.parsed} clients (${percentage}%)`;
                    }
                  }
                }
              },
            }}
          />
        </div>
      </div>

    </div>

    {/* Deuxième ligne de graphiques - 2 graphiques côte à côte */}
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 4. Graphique en barres - Points de fidélité par client */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Points de Fidélité par Client</h3>
        <div className="h-64">
          <Bar 
            data={{
              labels: filteredCustomers.map(customer => customer.nom || `Client ${customer.id}`),
              datasets: [
                {
                  label: "Points de fidélité",
                  data: filteredCustomers.map(customer => customer.loyaltyPoints || 0),
                  backgroundColor: "#FF6384",
                  borderColor: "#FF4560",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: "Points de fidélité accumulés"
                },
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Points de fidélité"
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: "Clients"
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* 5. Graphique doughnut - Taux de Rachat des Points (déplacé ici) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          Taux de Rachat des Points (6 derniers mois)
          <span className="text-sm text-gray-500 ml-2">🔄 Engagement des clients</span>
        </h3>
        
        {/* Métriques rapides */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-green-100 p-2 rounded text-center">
            <div className="font-semibold text-green-800">
              {filteredCustomers.filter(c => (c.loyaltyPoints || 0) < 500).length}
            </div>
            <div className="text-green-600">Clients avec rachats</div>
          </div>
          <div className="bg-red-100 p-2 rounded text-center">
            <div className="font-semibold text-red-800">
              {filteredCustomers.filter(c => (c.loyaltyPoints || 0) >= 500).length}
            </div>
            <div className="text-red-600">Points non utilisés</div>
          </div>
        </div>
        
        <div className="h-64 flex items-center justify-center">
          <Doughnut 
            data={{
              labels: [
                "Clients engagés (avec rachats)",
                "Clients dormants (sans rachats)"
              ],
              datasets: [
                {
                  data: [
                    filteredCustomers.filter(c => (c.loyaltyPoints || 0) < 500).length, // Clients qui ont probablement racheté (moins de points)
                    filteredCustomers.filter(c => (c.loyaltyPoints || 0) >= 500).length  // Clients qui accumulent sans racheter
                  ],
                  backgroundColor: ["#10B981", "#EF4444"],
                  borderWidth: 2,
                  borderColor: "#fff",
                  hoverBackgroundColor: ["#059669", "#DC2626"]
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                title: { 
                  display: true, 
                  text: "Engagement des clients avec le programme de fidélité"
                },
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                      size: 11
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((context.parsed * 100) / total).toFixed(1);
                      return `${context.label}: ${context.parsed} clients (${percentage}%)`;
                    }
                  }
                }
              },
            }}
          />
        </div>
        
        {/* Statistiques détaillées */}
        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>📊 Total clients analysés:</span>
            <span className="font-medium">{filteredCustomers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>💰 Points moyens par client:</span>
            <span className="font-medium text-blue-600">
              {filteredCustomers.length > 0 ? (filteredCustomers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) / filteredCustomers.length).toFixed(0) : 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span>🎯 Taux d'engagement estimé:</span>
            <span className="font-medium text-green-600">
              {filteredCustomers.length > 0 ? ((filteredCustomers.filter(c => (c.loyaltyPoints || 0) < 500).length / filteredCustomers.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

    </div>

    {/* Détails du client sélectionné (si applicable) */}
    {selectedCustomer && (
      <div className="bg-white p-4 rounded-md shadow-md mt-6">
        <h3 className="text-xl font-semibold mb-4">Détails du Client : {selectedCustomer.nom || `Client ${selectedCustomer.userId}`}</h3>
        {loadingCustomerDetail ? (
          <p>Chargement des détails...</p>
        ) : customerDetailData ? (
          <div>
            <p>Total commandes (6 derniers mois) : {customerDetailData.totalOrders}</p>
            <p>Montant total dépensé : {customerDetailData.totalAmount.toFixed(2)} DT</p>
            <p>Montant moyen par commande : {customerDetailData.averageOrderAmount} DT</p>
            <p>Total points gagnés (6 derniers mois) : {customerDetailData.totalLoyaltyPoints || 0}</p>
            <h4 className="mt-2 font-semibold">Répartition mensuelle (Graphique) :</h4>
            <div className="h-64">
              <Line 
                data={{
                  labels: Object.keys(customerDetailData.monthlyBreakdown),
                  datasets: [
                    {
                      label: "Nombre de commandes",
                      data: Object.values(customerDetailData.monthlyBreakdown),
                      fill: false,
                      backgroundColor: "#4BC0C0",
                      borderColor: "#369999",
                      borderWidth: 2,
                      tension: 0.1,
                      yAxisID: "y-axis-orders",
                    },
                    {
                      label: "Points de fidélité gagnés",
                      data: Object.values(customerDetailData.monthlyLoyaltyPoints || {}),
                      fill: false,
                      backgroundColor: "#FF6384",
                      borderColor: "#FF4560",
                      borderWidth: 2,
                      tension: 0.1,
                      yAxisID: "y-axis-points",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: "Répartition des commandes et points par mois"
                    },
                    legend: {
                      display: true
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label;
                          const value = context.parsed.y;
                          return `${label}: ${value} ${label.includes("commandes") ? "commande(s)" : "point(s)"}`;
                        }
                      }
                    }
                  },
                  scales: {
                    "y-axis-orders": {
                      type: "linear",
                      position: "left",
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Nombre de commandes"
                      },
                      ticks: {
                        stepSize: 1
                      }
                    },
                    "y-axis-points": {
                      type: "linear",
                      position: "right",
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Points de fidélité"
                      },
                      grid: {
                        drawOnChartArea: false, // Évite de superposer les grilles
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Mois"
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <p>Aucune donnée détaillée disponible pour ce client.</p>
        )}
        <button
          onClick={() => setSelectedCustomer(null)}
          className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Fermer les détails
        </button>
      </div>
    )}
  </div>
)}
{activeSubSection === "stocks" && (
  <div>
    {/* Section Stocks */}
    <div className="bg-white p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Stocks</h2>
      <div className="max-w-full">
        <Bar
          data={{
            labels: products.map(p => p.name),
            datasets: [{
              label: "Stock Disponible",
              data: products.map(p => p.stock || 0),
              backgroundColor: "#36A2EB",
              borderColor: "#1E90FF",
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              title: { display: true, text: "Niveau de Stock - Cliquez pour voir l'historique" },
              legend: { display: true }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "Stock" } },
              x: { title: { display: true, text: "Produits" } }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const clickedIndex = elements[0].index;
                const selected = products[clickedIndex];
                console.log("Produit sélectionné:", selected);
                handleProductClick(selected);
              }
            },
            onHover: (event, elements) => {
              event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default";
            }
          }}
        />
      </div>
    </div>

    {/* Debug info */}
    <div className="bg-gray-100 p-2 rounded-md mt-2 text-xs">
      <p><strong>Debug:</strong> Produits chargés: {products.length}</p>
      <p>ShopId sélectionné: {selectedShopId || user?.shopId || "Non défini"}</p>
      {selectedProduct && (
        <p>Produit sélectionné: {selectedProduct.name} (ID: {selectedProduct._id})</p>
      )}
    </div>

    {/* Détail produit sélectionné */}
    {selectedProduct && (
      <div className="bg-white p-4 rounded-md shadow-md mt-6">
        <h3 className="text-xl font-semibold mb-4">
          Évolution du stock - {selectedProduct.name}
        </h3>
        
        {/* Affichage des données brutes pour debug */}
        <div className="bg-yellow-50 p-2 rounded-md mb-4 text-xs">
          <p><strong>Debug données:</strong></p>
          <p>Stock actuel du produit: {selectedProduct.stock}</p>
          <p>Données historique: {JSON.stringify(stockHistoryData)}</p>
          <p>Labels: {JSON.stringify(stockHistoryLabels)}</p>
        </div>
        
        <div className="h-64">
          {stockHistoryLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Chargement de l'historique...</p>
              </div>
            </div>
          ) : (
            <Line
              data={{
                labels: stockHistoryLabels,
                datasets: [{
                  label: "Stock",
                  data: stockHistoryData,
                  fill: false,
                  borderColor: "#36A2EB",
                  backgroundColor: "rgba(54, 162, 235, 0.1)",
                  tension: 0.1,
                  pointBackgroundColor: "#36A2EB",
                  pointBorderColor: "#36A2EB",
                  pointRadius: 5,
                  pointHoverRadius: 7
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: `Évolution du Stock - ${selectedProduct.name} (6 derniers mois)`
                  },
                  legend: { display: true }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    title: { display: true, text: "Stock" },
                    ticks: {
                      stepSize: 1
                    }
                  },
                  x: { title: { display: true, text: "Mois" } }
                }
              }}
            />
          )}
        </div>
        
        {!stockHistoryLoading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Statistiques de stock :</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Stock actuel</p>
                <p className="font-semibold">{stockHistoryData[stockHistoryData.length - 1] || 0} unités</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock il y a 6 mois</p>
                <p className="font-semibold">{stockHistoryData[0] || 0} unités</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Évolution</p>
                <p className={`font-semibold ${((stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)) >= 0 ? '+' : ''}
                  {(stockHistoryData[stockHistoryData.length - 1] || 0) - (stockHistoryData[0] || 0)} unités
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-semibold mb-2">Détail par mois :</h5>
              <div className="grid grid-cols-6 gap-2">
                {stockHistoryLabels.map((month, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-600">{month}</p>
                    <p className="font-semibold text-blue-600">
                      {stockHistoryData[index] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Message d'erreur s'il y en a */}
        {message && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {message}
          </div>
        )}
        
        <button
          onClick={() => {
            setSelectedProduct(null);
            setMessage(""); // Clear message when closing
          }}
          className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Fermer
        </button>
      </div>
    )}

    {/* Section Prévisions avec Graphiques Optimisés */}
    {forecasts && forecasts.length > 0 && (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6">Prévisions de Demande Saisonnière</h2>
        
        
        {/* Graphique de synthèse - Demande prévue vs Stock actuel */}
        <div className="bg-white p-4 rounded-md shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Vue d'ensemble - Demande vs Stock</h3>
          <div className="max-w-full">
            <Bar
              data={{
                labels: forecasts.map(f => f.productName),
                datasets: [
                  {
                    label: "Demande Prévue",
                    data: forecasts.map(f => parseInt(f.peakDemand) || 0),
                    backgroundColor: "#FF6384",
                    borderColor: "#FF6384",
                    borderWidth: 1
                  },
                  {
                    label: "Stock Actuel",
                    data: forecasts.map(f => parseInt(f.currentStock) || 0),
                    backgroundColor: "#36A2EB",
                    borderColor: "#36A2EB",
                    borderWidth: 1
                  },
                  {
                    label: "Stock Suggéré",
                    data: forecasts.map(f => (parseInt(f.currentStock) || 0) + (parseInt(f.suggestedIncrease) || 0)),
                    backgroundColor: "#4BC0C0",
                    borderColor: "#4BC0C0",
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  title: { display: true, text: "Comparaison Demande vs Stock par Produit" },
                  legend: { display: true }
                },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: "Quantité" } },
                  x: { title: { display: true, text: "Produits" } }
                }
              }}
            />
          </div>
        </div>

        {/* JAUGES - Alertes Stock vs Demande */}
       <div className="relative group/alerts">
  {/* Arrière-plan avec effet de profondeur */}
  <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-yellow-900/20 rounded-3xl opacity-0 group-hover/alerts:opacity-100 transition-all duration-700 transform scale-95 group-hover/alerts:scale-100 blur-2xl"></div>
  
  <div className="relative bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30 mb-6 overflow-hidden">
    {/* Effets de lumière en arrière-plan */}
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/10 to-orange-600/10 rounded-full blur-3xl group-hover/alerts:scale-110 transition-transform duration-1000"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-400/10 to-red-600/10 rounded-full blur-3xl group-hover/alerts:scale-110 transition-transform duration-1000"></div>
    
    {/* Header sophistiqué */}
    <div className="relative z-10 flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-orange-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl group-hover/alerts:shadow-red-500/25 transition-all duration-500">
            <span className="text-2xl group-hover/alerts:scale-110 transition-transform duration-300">⚠️</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-400 to-orange-500 rounded-full animate-pulse flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-red-700 via-orange-700 to-yellow-700 bg-clip-text text-transparent">
            Alertes Stock - Niveau de Risque
          </h3>
          <p className="text-gray-500 font-medium">Monitoring intelligent des stocks critiques</p>
        </div>
      </div>
      
      {/* Indicateurs globaux */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-xl border border-red-200/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-700">Surveillance Active</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-2 rounded-xl border border-slate-200/50">
          <span className="text-sm font-semibold text-slate-700">Temps Réel</span>
        </div>
      </div>
    </div>
    
    {/* Grille des alertes */}
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forecasts.map(forecast => {
        const currentStock = parseInt(forecast.currentStock) || 0;
        const peakDemand = parseInt(forecast.peakDemand) || 0;
        const riskLevel = currentStock >= peakDemand ? 'safe' : 
                         currentStock >= peakDemand * 0.7 ? 'warning' : 'danger';
        const percentage = Math.min((currentStock / peakDemand) * 100, 100);
        
        const colors = {
          safe: { 
            bg: 'from-emerald-50 to-green-50', 
            text: 'text-emerald-700', 
            border: 'border-emerald-300/50',
            shadow: 'shadow-emerald-500/20',
            glow: 'from-emerald-400/20 to-green-600/20',
            stroke: '#10b981',
            icon: '✅',
            status: 'SÉCURISÉ'
          },
          warning: { 
            bg: 'from-amber-50 to-yellow-50', 
            text: 'text-amber-700', 
            border: 'border-amber-300/50',
            shadow: 'shadow-amber-500/20',
            glow: 'from-amber-400/20 to-yellow-600/20',
            stroke: '#f59e0b',
            icon: '⚠️',
            status: 'ATTENTION'
          },
          danger: { 
            bg: 'from-red-50 to-rose-50', 
            text: 'text-red-700', 
            border: 'border-red-300/50',
            shadow: 'shadow-red-500/20',
            glow: 'from-red-400/20 to-rose-600/20',
            stroke: '#ef4444',
            icon: '🚨',
            status: 'CRITIQUE'
          }
        };

        return (
          <div key={forecast.productId} className="group/card relative">
            {/* Effet de halo au hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors[riskLevel].glow} rounded-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-500 transform scale-90 group-hover/card:scale-100 blur-xl`}></div>
            
            {/* Carte principale */}
            <div className={`relative bg-gradient-to-br ${colors[riskLevel].bg} backdrop-blur-sm p-6 rounded-2xl border-2 ${colors[riskLevel].border} shadow-lg hover:${colors[riskLevel].shadow} transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden`}>
              {/* Effet de brillance */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              
              {/* Header de la carte */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-gray-800 truncate flex-1 mr-2">{forecast.productName}</h4>
                <div className={`w-8 h-8 bg-gradient-to-br ${colors[riskLevel].bg} rounded-full flex items-center justify-center border-2 ${colors[riskLevel].border}`}>
                  <span className="text-sm">{colors[riskLevel].icon}</span>
                </div>
              </div>
              
              {/* Jauge circulaire premium */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                {/* Cercle de fond avec effet de profondeur */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-inner"></div>
                
                {/* SVG pour la jauge */}
                <svg className="w-32 h-32 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  {/* Cercle de fond */}
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6"/>
                  {/* Cercle de progression avec animation */}
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke={colors[riskLevel].stroke}
                    strokeWidth="6"
                    strokeDasharray={`${(percentage * 2.64)} 264`}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.2))',
                      animation: 'dash 2s ease-in-out'
                    }}
                  />
                  {/* Cercle intérieur décoratif */}
                  <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                </svg>
                
                {/* Pourcentage central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${colors[riskLevel].text}`}>
                      {Math.round(percentage)}%
                    </span>
                    <div className={`w-8 h-0.5 bg-gradient-to-r ${colors[riskLevel].bg} mx-auto mt-1 rounded-full`}></div>
                  </div>
                </div>
              </div>
              
              {/* Métriques détaillées */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">Stock Actuel</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{currentStock.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">Demande Pic</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{peakDemand.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Badge de statut */}
              <div className={`text-center p-3 rounded-xl border-2 ${colors[riskLevel].border} bg-white/30 backdrop-blur-sm`}>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{colors[riskLevel].icon}</span>
                  <span className={`text-sm font-bold ${colors[riskLevel].text} tracking-wide`}>
                    {colors[riskLevel].status}
                  </span>
                </div>
              </div>
              
              {/* Indicateur de tendance */}
              <div className="mt-3 text-center">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-white/30 ${colors[riskLevel].text} text-xs font-medium`}>
                  <span>Ratio: {((currentStock / peakDemand) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Légende et statistiques */}
    <div className="mt-8 pt-6 border-t border-white/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/30">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">✅</span>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600">Niveau Sécurisé</p>
            <p className="text-xs text-emerald-500">Stock ≥ 100% demande</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200/30">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-600">Niveau Attention</p>
            <p className="text-xs text-amber-500">Stock 70-99% demande</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-red-50/50 rounded-xl border border-red-200/30">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🚨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">Niveau Critique</p>
            <p className="text-xs text-red-500">{`Stock < 70% demande`}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Cartes individuelles avec AREA CHARTS optimisés */}
       {forecasts.map((forecast) => {
         const getEventName = (eventLabel) => {
    if (!eventLabel) return null;
    if (/Noël|🎄/i.test(eventLabel)) return 'Noël';
    if (/Saint.?Valentin|💖/i.test(eventLabel)) return 'Saint-Valentin';
    if (/Black.?Friday|🛒/i.test(eventLabel)) return 'Black Friday';
    return null;
  };

  // Utilisation
  const eventName = getEventName(forecast.eventLabel);
  const eventImage = eventName ? EVENT_IMAGES[eventName] : null;


  return (
    <div key={forecast.productId} className="bg-white p-4 rounded-md shadow-md mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne GAUCHE - Infos texte */}
        <div>
          <h4 className="text-lg font-semibold mb-3">{forecast.productName}</h4>
          <div className="space-y-2">
           <p>
  <strong>Période de forte demande :</strong> {forecast.peakPeriod}
  {forecast.eventLabel && (
    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
      {forecast.eventLabel}
    </span>
  )}
</p>
            <p><strong>Demande prévue :</strong> <span className="text-red-600 font-bold">{forecast.peakDemand}</span></p>
            <p><strong>Stock actuel :</strong> <span className="text-blue-600 font-bold">{forecast.currentStock}</span></p>
            <p><strong>Augmentation suggérée :</strong> <span className="text-green-600 font-bold">{forecast.suggestedIncrease} ({forecast.suggestedPercentage})</span></p>
          </div>

          {/* AJOUT: Grande image centrée sous les infos */}
          {eventImage && (
            <div className="mt-6 flex justify-center">
              <img 
                src={eventImage} 
                alt={eventName}
                className="w-48 h-48 object-contain" // Taille réglable ici
              />
            </div>
          )}
        </div>

        {/* Colonne DROITE - Graphique (EXACTEMENT comme avant) */}
        <div>
          <h5 className="font-semibold mb-3">📈 Prévisions avec Zone d'Incertitude</h5>
          <div className="h-64">
            <Line
              data={{
                labels: Object.keys(forecast.monthlyPredictions),
                datasets: [
                  {
                    label: "Zone d'incertitude",
                    data: Object.values(forecast.monthlyPredictions).map(pred => pred.upper_bound),
                    borderColor: "rgba(255, 99, 132, 0.2)",
                    backgroundColor: "rgba(255, 99, 132, 0.1)",
                    fill: '+1',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1,
                    order: 3
                  },
                  {
                    label: "Limite Inférieure",
                    data: Object.values(forecast.monthlyPredictions).map(pred => pred.lower_bound),
                    borderColor: "rgba(255, 99, 132, 0.2)",
                    backgroundColor: "rgba(255, 99, 132, 0.1)",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1,
                    order: 4
                  },
                  {
                    label: "Prévision Principale",
                    data: Object.values(forecast.monthlyPredictions).map(pred => pred.predicted),
                    borderColor: "#FF6384",
                    backgroundColor: "#FF6384",
                    fill: 'none',
                    tension: 0.2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                    order: 1
                  },
                  {
                    label: "Stock Actuel",
                    data: Array(Object.keys(forecast.monthlyPredictions).length).fill(parseInt(forecast.currentStock) || 0),
                    borderColor: "#36A2EB",
                    backgroundColor: "#36A2EB",
                    borderDash: [10, 5],
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    order: 2
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  intersect: false,
                  mode: 'index'
                },
                plugins: {
                  title: { 
                    display: true, 
                    text: `🎯 ${forecast.productName} - Prévisions vs Stock`,
                    font: { size: 14 }
                  },
                  legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                      filter: (item) => item.text !== 'Limite Inférieure'
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    callbacks: {
                      afterBody: (context) => {
                        const monthIndex = context[0].dataIndex;
                        const monthData = Object.values(forecast.monthlyPredictions)[monthIndex];
                        if (monthData.eventLabel) {
                          return [`🎉 Événement: ${monthData.eventLabel}`];
                        }
                        return [];
                      }
                    }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    title: { display: true, text: "Quantité" },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  },
                  x: { 
                    title: { display: true, text: "Mois" },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  }
                }
              }}
            />
          </div>
          
          {/* Section Événements (inchangée) */}
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <h6 className="font-semibold text-sm mb-2">📅 Événements Saisonniers:</h6>
            <div className="flex flex-wrap gap-2">
              {Object.entries(forecast.monthlyPredictions).map(([month, pred]) => (
                pred.eventLabel && (
                  <div key={month} className="flex items-center text-xs bg-yellow-100 px-2 py-1 rounded">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    <span><strong>{month} :</strong> {pred.eventLabel}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}

        {/* Section Prévisions Météo avec COMBINED CHARTS */}
        {forecasts.length > 0 && forecasts.some((f) => f.weatherAdjustmentMessage) && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-6">🌤️ Prévisions Ajustées par la Météo</h2>
            
            {/* COMBINED CHART - Demande + Météo */}
            <div className="relative group/chart">
  {/* Arrière-plan avec effet de profondeur */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-blue-800/20 to-indigo-800/20 rounded-3xl opacity-0 group-hover/chart:opacity-100 transition-all duration-700 transform scale-95 group-hover/chart:scale-100 blur-2xl"></div>
  
  <div className="relative bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
    {/* Effets de lumière en arrière-plan */}
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500"></div>
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl group-hover/chart:scale-110 transition-transform duration-1000"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl group-hover/chart:scale-110 transition-transform duration-1000"></div>
    
    {/* Header sophistiqué */}
    <div className="relative z-10 flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl group-hover/chart:shadow-blue-500/25 transition-all duration-500">
            <span className="text-2xl group-hover/chart:scale-110 transition-transform duration-300">🌧️</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
        </div>
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Impact Météo sur la Demande
          </h3>
          <p className="text-gray-500 font-medium">Analyse prédictive et corrélations météorologiques</p>
        </div>
      </div>
      
      {/* Indicateurs de performance */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-700">Temps Réel</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200/50">
          <span className="text-sm font-semibold text-blue-700">IA Avancée</span>
        </div>
      </div>
    </div>
    
    {/* Container du graphique avec glassmorphism */}
    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/40 overflow-hidden">
      {/* Particules décoratives */}
      <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
      <div className="absolute top-6 right-8 w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-8 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
      
      <div className="relative z-10 h-96">
        <Line
          data={{
            labels: forecasts.filter(f => f.weatherAdjustmentMessage).map(f => f.productName),
            datasets: [
              {
                type: 'bar',
                label: "📊 Demande Originale",
                data: forecasts.filter(f => f.weatherAdjustmentMessage).map(f => parseInt(f.peakDemand) || 0),
                backgroundColor: "rgba(99, 102, 241, 0.7)",
                borderColor: "#6366f1",
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                yAxisID: 'y',
                hoverBackgroundColor: "rgba(99, 102, 241, 0.9)",
                hoverBorderColor: "#4f46e5",
                hoverBorderWidth: 3
              },
              {
                type: 'bar',
                label: "🎯 Demande Ajustée Météo",
                data: forecasts.filter(f => f.weatherAdjustmentMessage).map(f => parseInt(f.adjustedPeakDemand) || 0),
                backgroundColor: "rgba(245, 158, 11, 0.7)",
                borderColor: "#f59e0b",
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                yAxisID: 'y',
                hoverBackgroundColor: "rgba(245, 158, 11, 0.9)",
                hoverBorderColor: "#d97706",
                hoverBorderWidth: 3
              },
              {
                type: 'line',
                label: "🌡️ Température Max (°C)",
                data: forecasts.filter(f => f.weatherAdjustmentMessage).map(f => 
                  f.weatherData?.temperatureRange?.[1] || 25
                ),
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointBackgroundColor: "#ef4444",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 3,
                pointHoverBackgroundColor: "#dc2626",
                pointHoverBorderColor: "#ffffff",
                pointHoverBorderWidth: 4,
                borderWidth: 4,
                yAxisID: 'y1',
                pointStyle: 'circle'
              },
              {
                type: 'line',
                label: "🌧️ Probabilité Pluie (%)",
                data: forecasts.filter(f => f.weatherAdjustmentMessage).map(f => 
                  f.weatherData?.rainLikelihood || 0
                ),
                borderColor: "#06b6d4",
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointBackgroundColor: "#06b6d4",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 3,
                pointHoverBackgroundColor: "#0891b2",
                pointHoverBorderColor: "#ffffff",
                pointHoverBorderWidth: 4,
                borderWidth: 4,
                borderDash: [10, 5],
                yAxisID: 'y1',
                pointStyle: 'triangle'
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
            },
            plugins: {
              title: { 
                display: true, 
                text: "📈 Corrélation Demande-Météo - Intelligence Prédictive",
                font: { 
                  size: 18,
                  weight: 'bold',
                  family: 'system-ui'
                },
                color: '#1f2937',
                padding: 20
              },
              legend: { 
                display: true, 
                position: 'top',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 20,
                  font: {
                    size: 12,
                    weight: '600'
                  },
                  color: '#374151'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#6366f1',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                usePointStyle: true,
                padding: 12,
                titleFont: {
                  size: 14,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 12
                }
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { 
                  display: true, 
                  text: "📊 Demande (unités)",
                  font: {
                    size: 14,
                    weight: 'bold'
                  },
                  color: '#374151'
                },
                grid: { 
                  color: 'rgba(99, 102, 241, 0.1)',
                  lineWidth: 1
                },
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 11,
                    weight: '500'
                  }
                },
                border: {
                  color: '#6366f1',
                  width: 2
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { 
                  display: true, 
                  text: "🌡️ Température (°C) / 🌧️ Pluie (%)",
                  font: {
                    size: 14,
                    weight: 'bold'
                  },
                  color: '#374151'
                },
                grid: { 
                  drawOnChartArea: false,
                  color: 'rgba(239, 68, 68, 0.1)'
                },
                ticks: { 
                  color: '#ef4444',
                  font: {
                    size: 11,
                    weight: '500'
                  }
                },
                border: {
                  color: '#ef4444',
                  width: 2
                }
              },
              x: { 
                title: { 
                  display: true, 
                  text: "🛍️ Produits",
                  font: {
                    size: 14,
                    weight: 'bold'
                  },
                  color: '#374151'
                },
                grid: {
                  color: 'rgba(156, 163, 175, 0.1)'
                },
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 11,
                    weight: '500'
                  }
                },
                border: {
                  color: '#9ca3af',
                  width: 2
                }
              }
            }
          }}
        />
      </div>
    </div>
    
    {/* Légende interactive en bas */}
    <div className="mt-6 pt-4 border-t border-white/30">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/30">
          <div className="w-4 h-4 bg-indigo-500 rounded"></div>
          <span className="text-sm font-semibold text-indigo-700">Demande Base</span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/30">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm font-semibold text-amber-700">Ajustement IA</span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-red-50/50 rounded-xl border border-red-200/30">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-sm font-semibold text-red-700">Température</span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-cyan-50/50 rounded-xl border border-cyan-200/30">
          <div className="w-4 h-4 bg-cyan-500 rounded-full border-2 border-dashed border-cyan-300"></div>
          <span className="text-sm font-semibold text-cyan-700">Précipitations</span>
        </div>
      </div>
    </div>
  </div>
</div>

            {/* Cartes météo individuelles */}
           {/* Section Météo (affichée une seule fois en haut) */}
{forecasts.length > 0 && forecasts[0].weatherData && (
  <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 rounded-2xl shadow-xl mb-6 border border-blue-100">
    <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🌤️ Prévisions Météorologiques</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Conditions météo actuelles */}
      <div>
        <h5 className="font-semibold mb-3 text-lg">🎯 Conditions Actuelles</h5>
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg border border-red-300 transform hover:scale-105 transition-all duration-300">
              <span className="flex items-center text-white">
                <span className="text-yellow-200 mr-2">☀️</span>
                Température
              </span>
              <span className="font-bold text-white">
                {forecasts[0].weatherData.temperatureRange?.[0] || "N/A"}°-{forecasts[0].weatherData.temperatureRange?.[1] || "N/A"}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg border border-blue-500 transform hover:scale-105 transition-all duration-300">
              <span className="flex items-center text-white">
                <span className="text-white mr-2">💧</span>
                Pluie
              </span>
              <div className="flex items-center">
                <div className="w-12 bg-white/30 rounded-full h-2 mr-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500" 
                    style={{width: `${forecasts[0].weatherData.rainLikelihood || 0}%`}}
                  ></div>
                </div>
                <span className="font-bold text-white">
                  {forecasts[0].weatherData.rainLikelihood || 0}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-200 to-blue-400 rounded-xl shadow-lg border border-blue-100 transform hover:scale-105 transition-all duration-300">
              <span className="flex items-center text-white">
                <span className="text-white mr-2">❄️</span>
                Froid
              </span>
              <span className="font-bold text-white">
                {forecasts[0].weatherData.cold ? 'Oui' : 'Non'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-lg border border-gray-300 transform hover:scale-105 transition-all duration-300">
              <span className="flex items-center text-white">
                <span className="text-white mr-2">💨</span>
                Vent
              </span>
              <span className="font-bold text-white">
                {forecasts[0].weatherData.windSpeed || 'N/A'} km/h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prévisions Quotidiennes */}
     {forecasts[0].weatherData?.dailyForecasts?.length > 0 && (
  <div className="relative group/forecast">
    {/* Arrière-plan avec effet de profondeur */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl opacity-0 group-hover/forecast:opacity-100 transition-all duration-700 transform scale-95 group-hover/forecast:scale-100 blur-2xl"></div>
    
    <div className="relative">
      {/* Header sophistiqué */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl group-hover/forecast:shadow-blue-500/25 transition-all duration-500">
            <span className="text-2xl group-hover/forecast:scale-110 transition-transform duration-300">📅</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">5</span>
          </div>
        </div>
        <div>
          <h5 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Prévisions Étendues
          </h5>
          <p className="text-gray-500 font-medium">Analyse météorologique sur 5 jours</p>
        </div>
      </div>

      {/* Container principal avec glassmorphism */}
      <div className="relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
        {/* Effets de lumière en arrière-plan */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 to-orange-400"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl group-hover/forecast:scale-110 transition-transform duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl group-hover/forecast:scale-110 transition-transform duration-1000"></div>
        
        {/* Grille des prévisions */}
        <div className="relative z-10 grid grid-cols-5 gap-4">
          {forecasts[0].weatherData.dailyForecasts.map((day, index) => (
            <div
              key={index}
              className="group/day relative overflow-hidden"
            >
              {/* Effet de hover pour chaque jour */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl opacity-0 group-hover/day:opacity-100 transition-all duration-500 transform scale-90 group-hover/day:scale-100 blur-xl"></div>
              
              {/* Carte de jour */}
              <div className="relative bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm p-5 rounded-2xl border border-white/50 hover:border-blue-300/70 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-xl">
                {/* Indicateur de jour actuel */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                )}
                
                {/* Contenu du jour */}
                <div className="text-center space-y-3">
                  {/* Date avec style premium */}
                  <div className="relative">
                    <p className="text-sm font-bold text-gray-800 mb-1 tracking-wide">
                      {day.date || 'N/A'}
                    </p>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
                  </div>
                  
                  {/* Températures avec design moderne */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl border border-orange-200/50">
                      <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {day.temperatureRange?.[0] || 'N/A'}°
                      </p>
                      <div className="w-6 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 mx-auto my-1 rounded-full"></div>
                      <p className="text-sm font-semibold text-blue-600">
                        {day.temperatureRange?.[1] || 'N/A'}°
                      </p>
                    </div>
                  </div>
                  
                  {/* Conditions météo stylisées */}
                  <div className="relative">
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-3 rounded-xl border border-slate-200/50">
                      <p className="text-xs font-medium text-slate-700 leading-tight">
                        {day.conditions || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Icône météo décorative */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full flex items-center justify-center opacity-50 group-hover/day:opacity-100 transition-opacity duration-300">
                    <span className="text-xs">🌤️</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Indicateur de fiabilité */}
        <div className="mt-6 pt-4 border-t border-white/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Précision des prévisions</span>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < 4 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  </div>
)}
{/* Liste des produits */}
<div className="space-y-8">
  {forecasts.map((forecast) => (
    forecast.weatherAdjustmentMessage && (
      <div key={forecast.productId} className="group relative">
        {/* Arrière-plan avec effet de profondeur */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 transform scale-95 group-hover:scale-100 blur-xl"></div>
        
        {/* Carte principale */}
        <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20 hover:border-blue-200/50 transition-all duration-500 overflow-hidden">
          {/* Effet de lumière en arrière-plan */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations produit */}
            <div className="space-y-6">
              {/* Header avec animation */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-500">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🌦️</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">{forecast.productName}</h4>
                  <p className="text-gray-500 font-medium">Analyse prédictive avancée</p>
                </div>
              </div>
              
              {/* Métriques avec design premium */}
              <div className="space-y-4">
                {/* Demande ajustée */}
                <div className="relative group/metric">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-2xl blur opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200/50 hover:border-amber-300/70 transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">📊</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Demande Ajustée</p>
                          <p className="text-2xl font-bold text-amber-700">{forecast.adjustedPeakDemand}</p>
                        </div>
                      </div>
                      <div className="w-2 h-12 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Augmentation */}
                <div className="relative group/metric">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-2xl blur opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">📈</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Augmentation</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {forecast.adjustedSuggestedIncrease}
                            <span className="text-lg ml-2 text-orange-600">({forecast.adjustedSuggestedPercentage})</span>
                          </p>
                        </div>
                      </div>
                      <div className="w-2 h-12 bg-gradient-to-b from-orange-400 to-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Analyse météo premium */}
                <div className="relative group/weather">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover/weather:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 rounded-2xl border border-slate-200/50 hover:border-blue-300/70 transition-all duration-500 overflow-hidden">
                    {/* Effet de particules */}
                    <div className="absolute top-0 left-0 w-full h-full">
                      <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                      <div className="absolute top-8 right-8 w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-6 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">☁️</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Intelligence Météorologique</p>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed text-lg">{forecast.weatherAdjustmentMessage}</p>
                      </div>
                    </div>
                    
                    
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  ))}
</div>
          </div>
        )}
      </div>
    )}
    </div>
)}










              {activeSubSection === "saas" && (
                <div className="bg-white p-4 rounded-md shadow-md">
                  <h2 className="text-xl font-semibold mb-4">SaaS</h2>
                  <div className="max-w-full">
                    <ChartComponent data={chartDataConfig} options={chartOptionsConfig} />
                  </div>
                </div>
              )}
            </div>
          )}
{activeSection === "calendrier" && (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
    </div>

    <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          <FaChevronRight />
        </button>
        <button
          onClick={() => {
            setNewEvent({ title: "", color: "primary", startDate: "", endDate: "" });
            setShowAddEventModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Add Event +
        </button>
      </div>

      <div className="text-lg font-semibold text-gray-900">
        {formatDateRange()}
      </div>

      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        <button
          onClick={() => setCalendarView("month")}
          className={`px-4 py-2 text-sm ${
            calendarView === "month"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          month
        </button>
        <button
          onClick={() => setCalendarView("week")}
          className={`px-4 py-2 text-sm border-l border-r border-gray-300 ${
            calendarView === "week"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          week
        </button>
        <button
          onClick={() => setCalendarView("day")}
          className={`px-4 py-2 text-sm ${
            calendarView === "day"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          day
        </button>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-gray-200 overflow-auto">
      {renderCalendar()}
    </div>

    {/* Modal de visualisation d'événement */}
    {showEventDetailsModal && selectedEvent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Event Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEventDetailsModal(false);
                  setNewEvent(selectedEvent);
                  setShowAddEventModal(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => setShowEventDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedEvent.title}</h3>
              {selectedEvent.eventType && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {selectedEvent.eventType === 'store' && '🏪 Store Event'}
                    {selectedEvent.eventType === 'staff' && '👥 Staff Meeting'}
                    {selectedEvent.eventType === 'inventory' && '📦 Inventory Management'}
                    {selectedEvent.eventType === 'marketing' && '📢 Marketing Campaign'}
                    {selectedEvent.eventType === 'maintenance' && '🔧 Maintenance'}
                    {selectedEvent.eventType === 'training' && '🎓 Training Session'}
                    {selectedEvent.eventType === 'delivery' && '🚚 Important Delivery'}
                    {selectedEvent.eventType === 'customer' && '🤝 Customer Event'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <p className="p-2 bg-gray-50 rounded border">{formatEventDate(selectedEvent.startDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <p className="p-2 bg-gray-50 rounded border">{formatEventDate(selectedEvent.endDate)}</p>
              </div>
            </div>

            {selectedEvent.priority && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <p className="p-2 bg-gray-50 rounded border">
                  {selectedEvent.priority === 'low' && '🟢 Low Priority'}
                  {selectedEvent.priority === 'medium' && '🟡 Medium Priority'}
                  {selectedEvent.priority === 'high' && '🔴 High Priority'}
                  {selectedEvent.priority === 'urgent' && '🚨 Urgent'}
                </p>
              </div>
            )}

            {selectedEvent.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes & Description</label>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this event?')) {
                  handleDeleteEvent(selectedEvent.id);
                  setShowEventDetailsModal(false);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Event
            </button>
            <button
              onClick={() => setShowEventDetailsModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal d'ajout/modification d'événement */}
    {showAddEventModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {newEvent.id ? "Edit Business Event" : "Schedule Business Event"}
            </h2>
            <button
              onClick={() => setShowAddEventModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Plan your business operations: schedule meetings, inventory, marketing campaigns, and store events
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={newEvent.eventType || ''}
                onChange={(e) => setNewEvent({...newEvent, eventType: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Event Type</option>
                <option value="store">🏪 Store Event</option>
                <option value="staff">👥 Staff Meeting</option>
                <option value="inventory">📦 Inventory Management</option>
                <option value="marketing">📢 Marketing Campaign</option>
                <option value="maintenance">🔧 Maintenance</option>
                <option value="training">🎓 Training Session</option>
                <option value="delivery">🚚 Important Delivery</option>
                <option value="customer">🤝 Customer Event</option>
              </select>
            </div>

            {newEvent.eventType === "staff" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                  <input
                    type="text"
                    value={newEvent.participants || ''}
                    onChange={(e) => setNewEvent({...newEvent, participants: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Ex: Manager, Cashiers, Sales team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Room/Location</label>
                  <input
                    type="text"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Ex: Main office, Store backroom"
                  />
                </div>
              </>
            )}

            {newEvent.eventType === "inventory" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Action</label>
                  <select
                    value={newEvent.inventoryAction || ''}
                    onChange={(e) => setNewEvent({...newEvent, inventoryAction: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Action</option>
                    <option value="restock">📈 Restock Products</option>
                    <option value="count">🔢 Inventory Count</option>
                    <option value="clearance">💸 Clearance Sale</option>
                    <option value="newProducts">🆕 New Products Arrival</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Products/Categories</label>
                  <input
                    type="text"
                    value={newEvent.products || ''}
                    onChange={(e) => setNewEvent({...newEvent, products: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Ex: Electronics, Clothing, All store"
                  />
                </div>
              </>
            )}

            {newEvent.eventType === "marketing" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                  <select
                    value={newEvent.campaignType || ''}
                    onChange={(e) => setNewEvent({...newEvent, campaignType: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Campaign</option>
                    <option value="social">📱 Social Media Post</option>
                    <option value="email">📧 Email Campaign</option>
                    <option value="ads">📺 Advertisement Launch</option>
                    <option value="influencer">⭐ Influencer Collaboration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={newEvent.audience || ''}
                    onChange={(e) => setNewEvent({...newEvent, audience: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Ex: All customers, New customers, VIP members"
                  />
                </div>
              </>
            )}

            {newEvent.eventType === "store" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store Event Type</label>
                  <select
                    value={newEvent.storeEventType || ''}
                    onChange={(e) => setNewEvent({...newEvent, storeEventType: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Store Event</option>
                    <option value="opening">🎉 Store Opening</option>
                    <option value="renovation">🏗️ Store Renovation</option>
                    <option value="closure">🚫 Temporary Closure</option>
                    <option value="showcase">✨ Product Showcase</option>
                    <option value="vip">👑 VIP Customer Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Attendance</label>
                  <input
                    type="number"
                    value={newEvent.expectedAttendance || ''}
                    onChange={(e) => setNewEvent({...newEvent, expectedAttendance: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Number of people expected"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes & Description</label>
              <textarea
                value={newEvent.notes || ''}
                onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Additional details, instructions, or reminders..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <select
                value={newEvent.priority || 'medium'}
                onChange={(e) => setNewEvent({...newEvent, priority: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Color</label>
              <div className="flex gap-4">
                {['danger', 'success', 'primary', 'warning'].map(color => (
                  <label key={color} className="flex items-center">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      checked={newEvent.color === color}
                      onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                      className="mr-2"
                    />
                    <span className="capitalize">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {calendarView === "day" ? "Enter Start Date & Time" : "Enter Start Date"}
              </label>
              <input
                type={calendarView === "day" ? "datetime-local" : "date"}
                value={newEvent.startDate || ''}
                onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {calendarView === "day" ? "Enter End Date & Time" : "Enter End Date"}
              </label>
              <input
                type={calendarView === "day" ? "datetime-local" : "date"}
                value={newEvent.endDate || ''}
                onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowAddEventModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {newEvent.id ? "Update Event" : "Add Event"}
            </button>
          </div>
        </div>
      </div>
    )}
        
  </div>
)}
{activeSection === "clients" && (
  <>
    <div className="bg-white p-4 rounded-md shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Recherche et Filtres</h2>
      <input
        type="text"
        placeholder="Rechercher par nom..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          type="number"
          name="minPoints"
          placeholder="Points minimum"
          value={filters.minPoints}
          onChange={handleFilterChange}
          className="p-2 border rounded"
          min="0"
        />
        <input
          type="number"
          name="minOrders"
          placeholder="Commandes minimum"
          value={filters.minOrders}
          onChange={handleFilterChange}
          className="p-2 border rounded"
          min="0"
        />
        <input
          type="date"
          name="lastVisit"
          value={filters.lastVisit}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
      </div>
    </div>

    <div className="bg-white p-4 rounded-md shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Clients Fidèles</h2>
      {loading ? (
        <p>Chargement des clients...</p>
      ) : loyalCustomers.length === 0 ? (
        <p>Aucun client n'a encore passé de commande dans votre boutique.</p>
      ) : filteredCustomers.length === 0 ? (
        <p>Aucun client ne correspond aux filtres appliqués.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Nom</th>
              <th className="p-2">Points (Boutique)</th>
              <th className="p-2">Commandes</th>
              <th className="p-2">Dernière Commande</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Niveau</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => {
              // Calculer le niveau à partir de orderCount
              const calculateMerchantLoyaltyLevel = (orderCount) => {
                if (orderCount > 5) return "Or";
                if (orderCount >= 3) return "Argent";
                return "Bronze";
              };
              const level = calculateMerchantLoyaltyLevel(customer.orderCount || 0);

              return (
                <tr key={customer.userId} className="border-t">
                  <td className="p-2">{customer.userId.toString().slice(-6)}</td>
                  <td className="p-2">{customer.nom || "Utilisateur inconnu"}</td>
                  <td className="p-2">{customer.loyaltyPoints || 0}</td>
                  <td className="p-2">{customer.orderCount || 0}</td>
                  <td className="p-2">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        customer.status === "Engaged"
                          ? "bg-green-200 text-green-800"
                          : customer.status === "AtRisk"
                          ? "bg-yellow-200 text-yellow-800"
                          : customer.status === "Disengaged"
                          ? "bg-red-200 text-red-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {(customer.status && typeof customer.status === "string" && customer.status.length > 0
                        ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
                        : "Inconnu")}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        level === "Or"
                          ? "bg-yellow-200 text-yellow-800"
                          : level === "Argent"
                          ? "bg-gray-200 text-gray-800"
                          : level === "Bronze"
                          ? "bg-orange-200 text-orange-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {level}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleViewOrderHistory(customer.userId.toString())}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Historique
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>

    <div className="bg-white p-4 rounded-md shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Statistiques Clients</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Clients Total</h3>
          <p className="text-2xl">{stats.totalCustomers}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Points Total (Boutique)</h3>
          <p className="text-2xl">{stats.totalPoints}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Moyenne Points (Boutique)</h3>
          <p className="text-2xl">{stats.averagePoints?.toFixed(2) || "0.00"}</p>
        </div>
      </div>
    </div>
  </>
)}
          {activeSection === "points" && (
            <div className="bg-white p-4 rounded-md shadow-md">
              <h2 className="text-xl font-semibold mb-4">Gestion des Points</h2>
              <form onSubmit={handleAddPoints} className="mb-4">
                <input
                  type="text"
                  placeholder="ID Utilisateur"
                  value={pointsToAdd.userId}
                  onChange={(e) => setPointsToAdd({ ...pointsToAdd, userId: e.target.value })}
                  className="p-2 border rounded mr-2"
                />
                <input
                  type="number"
                  placeholder="Points à ajouter"
                  value={pointsToAdd.points}
                  onChange={(e) => setPointsToAdd({ ...pointsToAdd, points: e.target.value })}
                  className="p-2 border rounded mr-2"
                  min="0"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Ajouter
                </button>
              </form>
              <form onSubmit={handleUpdatePointsConfig} className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Configuration des Points</h3>
                <label className="block mb-2">
                  Multiplicateurs :
                  <input
                    type="number"
                    value={pointsConfig.multipliers.order || ""}
                    onChange={(e) =>
                      setPointsConfig({ ...pointsConfig, multipliers: { ...pointsConfig.multipliers, order: e.target.value } })
                    }
                    placeholder="Multiplicateur commande"
                    className="p-2 border rounded ml-2"
                    min="0"
                  />
                </label>
                <label className="block mb-2">
                  Activé :
                  <input
                    type="checkbox"
                    checked={pointsConfig.enabled}
                    onChange={(e) => setPointsConfig({ ...pointsConfig, enabled: e.target.checked })}
                    className="ml-2"
                  />
                </label>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Mettre à jour
                </button>
              </form>
            </div>
          )}
{activeSection === "rewards" && (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Récompenses</h1>
          <button
            onClick={() => setShowCreateRewardModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <span>+</span>
            Créer une Récompense
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Récompenses Actives</h3>
          {rewards.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>Aucune récompense active pour le moment.</p>
              <p>Créez votre première récompense en cliquant sur le bouton ci-dessus.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <div key={reward._id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg capitalize">
                      {reward.type === "promotion" ? "Promotion" : reward.type === "specialOffer" ? "Offre Spéciale" : "Offre Personnalisée"}
                    </h4>
                    <span className={`px-2 py-1 rounded text-sm ${
                      new Date(reward.endDate) > new Date() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {new Date(reward.endDate) > new Date() ? "Active" : "Expirée"}
                    </span>
                  </div>
                  <div className="mb-2">
                    {reward.type === "promotion" && reward.productIds && reward.productIds.length > 0 && (
                      <div>
                        <p><strong>Produit(s):</strong> {reward.productIds.map(id => getProductNameById(id)).join(", ")}</p>
                        <p><strong>Réduction:</strong> {reward.discountValue || 0}%</p>
                      </div>
                    )}
                    {reward.type === "specialOffer" && reward.specialOffer && (
                      <div>
                        <p><strong>Type:</strong> {reward.specialOffer.type}</p>
                        {reward.specialOffer.multiplier && <p><strong>Multiplicateur:</strong> x{reward.specialOffer.multiplier}</p>}
                        {reward.specialOffer.buyProductId && <p><strong>Acheter:</strong> {getProductNameById(reward.specialOffer.buyProductId)}</p>}
                        {reward.specialOffer.getProductId && <p><strong>Obtenir:</strong> {getProductNameById(reward.specialOffer.getProductId)}</p>}
                      </div>
                    )}
                    {reward.type === "customOffer" && reward.customOffer && (
                      <div>
                        <p><strong>Titre:</strong> {reward.customOffer.title}</p>
                        <p><strong>Description:</strong> {reward.customOffer.description}</p>
                        {reward.customOffer.terms && <p><strong>Conditions:</strong> {reward.customOffer.terms}</p>}
                        {reward.customOffer.minPoints > 0 && <p><strong>Points minimum:</strong> {reward.customOffer.minPoints}</p>}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Début:</strong> {new Date(reward.startDate).toLocaleDateString("fr-FR")}</p>
                    <p><strong>Fin:</strong> {new Date(reward.endDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleEditReward(reward)}
                      className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward._id)}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateRewardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Créer une Nouvelle Récompense</h2>
                <button
                  onClick={() => setShowCreateRewardModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateReward} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de Récompense *</label>
                  <select
                    value={rewardForm.type}
                    onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="promotion">🏷️ Promotion</option>
                    <option value="specialOffer">🎁 Offre Spéciale</option>
                    <option value="customOffer">✨ Offre Personnalisée</option>
                  </select>
                </div>

                {rewardForm.type === "promotion" && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Produit(s) *</label>
                      <select
                        value={rewardForm.productIds[0] || ""}
                        onChange={(e) => {
                          const selectedProductId = e.target.value;
                          if (selectedProductId && !rewardForm.productIds.includes(selectedProductId)) {
                            setRewardForm((prev) => ({
                              ...prev,
                              productIds: [selectedProductId, ...prev.productIds.filter(id => id !== selectedProductId)],
                            }));
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">Valeur de Réduction (%) *</label>
                        <input
                          type="number"
                          value={rewardForm.discountValue}
                          onChange={(e) => setRewardForm({ ...rewardForm, discountValue: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                    </div>
                    {Array.from({ length: rewardForm.additionalProducts || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Produit(s) Aditionnel *</label>
                        <select
                          value={rewardForm.productIds[index + 1] || ""}
                          onChange={(e) => {
                            const selectedProductId = e.target.value;
                            if (selectedProductId && !rewardForm.productIds.includes(selectedProductId)) {
                              const newProductIds = [...rewardForm.productIds];
                              newProductIds[index + 1] = selectedProductId;
                              setRewardForm((prev) => ({
                                ...prev,
                                productIds: newProductIds,
                              }));
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Sélectionner un produit</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">Valeur de Réduction (%) *</label>
                          <input
                            type="number"
                            value={rewardForm.discountValues[index] || ""}
                            onChange={(e) => {
                              const newDiscountValues = [...(rewardForm.discountValues || [])];
                              newDiscountValues[index] = e.target.value;
                              setRewardForm((prev) => ({
                                ...prev,
                                discountValues: newDiscountValues,
                              }));
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRewardForm((prev) => ({
                        ...prev,
                        additionalProducts: (prev.additionalProducts || 0) + 1,
                        discountValues: [...(prev.discountValues || []), ""],
                      }))}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                )}

                {rewardForm.type === "specialOffer" && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type d'Offre Spéciale *</label>
                      <select
                        value={rewardForm.specialOffer.type}
                        onChange={(e) => setRewardForm({
                          ...rewardForm,
                          specialOffer: { ...rewardForm.specialOffer, type: e.target.value },
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner un type d'offre</option>
                        <option value="multiplicationPoints">✖️ Multiplication des Points</option>
                        <option value="buyOneGetOne">🛒 Acheter 1, Obtenir 1 Gratuit</option>
                      </select>
                    </div>

                    {rewardForm.specialOffer.type === "multiplicationPoints" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Multiplicateur de Points *</label>
                        <input
                          type="number"
                          value={rewardForm.specialOffer.multiplier}
                          onChange={(e) => setRewardForm({
                            ...rewardForm,
                            specialOffer: { ...rewardForm.specialOffer, multiplier: e.target.value },
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required
                        />
                      </div>
                    )}

                    {rewardForm.specialOffer.type === "buyOneGetOne" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Produit à Acheter *</label>
                          <select
                            value={rewardForm.specialOffer.buyProductId || ""}
                            onChange={(e) => setRewardForm({
                              ...rewardForm,
                              specialOffer: { ...rewardForm.specialOffer, buyProductId: e.target.value },
                            })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Produit Gratuit *</label>
                          <select
                            value={rewardForm.specialOffer.getProductId || ""}
                            onChange={(e) => setRewardForm({
                              ...rewardForm,
                              specialOffer: { ...rewardForm.specialOffer, getProductId: e.target.value },
                            })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Minimum Requis *</label>
                      <input
                        type="number"
                        value={rewardForm.specialOffer.minPoints}
                        onChange={(e) => setRewardForm({
                          ...rewardForm,
                          specialOffer: { ...rewardForm.specialOffer, minPoints: e.target.value },
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                )}

                {rewardForm.type === "customOffer" && (
                  <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l'Offre *</label>
                      <input
                        type="text"
                        value={rewardForm.customTitle || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customTitle: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Offre Spéciale du Mois"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description Personnalisée *</label>
                      <textarea
                        value={rewardForm.customDescription || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customDescription: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Profitez de 10% de réduction sur tout achat de plus de 50€ ce week-end !"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conditions (optionnel)</label>
                      <textarea
                        value={rewardForm.customTerms || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customTerms: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Offre valable uniquement en magasin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Minimum (optionnel)</label>
                      <input
                        type="number"
                        value={rewardForm.customMinPoints || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customMinPoints: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        placeholder="Ex: 100"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">📅 Période de Validité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de Début *</label>
                      <input
                        type="date"
                        value={rewardForm.startDate}
                        onChange={(e) => setRewardForm({ ...rewardForm, startDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de Fin *</label>
                      <input
                        type="date"
                        value={rewardForm.endDate}
                        onChange={(e) => setRewardForm({ ...rewardForm, endDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateRewardModal(false)}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                  >
                    <span>✓</span>
                    Créer la Récompense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditRewardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Modifier une Récompense</h2>
                <button
                  onClick={() => {
                    setShowEditRewardModal(false);
                    setEditingReward(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateReward} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de Récompense *</label>
                  <select
                    value={rewardForm.type}
                    onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="promotion">🏷️ Promotion</option>
                    <option value="specialOffer">🎁 Offre Spéciale</option>
                    <option value="customOffer">✨ Offre Personnalisée</option>
                  </select>
                </div>

                {rewardForm.type === "promotion" && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Produit(s) *</label>
                      <select
                        value={rewardForm.productIds[0] || ""}
                        onChange={(e) => {
                          const selectedProductId = e.target.value;
                          if (selectedProductId && !rewardForm.productIds.includes(selectedProductId)) {
                            setRewardForm((prev) => ({
                              ...prev,
                              productIds: [selectedProductId, ...prev.productIds.filter(id => id !== selectedProductId)],
                            }));
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">Valeur de Réduction (%) *</label>
                        <input
                          type="number"
                          value={rewardForm.discountValue}
                          onChange={(e) => setRewardForm({ ...rewardForm, discountValue: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                    </div>
                    {Array.from({ length: rewardForm.additionalProducts || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Produit(s) Aditionnel *</label>
                        <select
                          value={rewardForm.productIds[index + 1] || ""}
                          onChange={(e) => {
                            const selectedProductId = e.target.value;
                            if (selectedProductId && !rewardForm.productIds.includes(selectedProductId)) {
                              const newProductIds = [...rewardForm.productIds];
                              newProductIds[index + 1] = selectedProductId;
                              setRewardForm((prev) => ({
                                ...prev,
                                productIds: newProductIds,
                              }));
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Sélectionner un produit</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">Valeur de Réduction (%) *</label>
                          <input
                            type="number"
                            value={rewardForm.discountValues[index] || ""}
                            onChange={(e) => {
                              const newDiscountValues = [...(rewardForm.discountValues || [])];
                              newDiscountValues[index] = e.target.value;
                              setRewardForm((prev) => ({
                                ...prev,
                                discountValues: newDiscountValues,
                              }));
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRewardForm((prev) => ({
                        ...prev,
                        additionalProducts: (prev.additionalProducts || 0) + 1,
                        discountValues: [...(prev.discountValues || []), ""],
                      }))}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                )}

                {rewardForm.type === "specialOffer" && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type d'Offre Spéciale *</label>
                      <select
                        value={rewardForm.specialOffer.type}
                        onChange={(e) => setRewardForm({
                          ...rewardForm,
                          specialOffer: { ...rewardForm.specialOffer, type: e.target.value },
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="multiplicationPoints">✖️ Multiplication des Points</option>
                        <option value="buyOneGetOne">🛒 Acheter 1, Obtenir 1 Gratuit</option>
                      </select>
                    </div>

                    {rewardForm.specialOffer.type === "multiplicationPoints" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Multiplicateur de Points *</label>
                        <input
                          type="number"
                          value={rewardForm.specialOffer.multiplier}
                          onChange={(e) => setRewardForm({
                            ...rewardForm,
                            specialOffer: { ...rewardForm.specialOffer, multiplier: e.target.value },
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required
                        />
                      </div>
                    )}

                    {rewardForm.specialOffer.type === "buyOneGetOne" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Produit à Acheter *</label>
                          <select
                            value={rewardForm.specialOffer.buyProductId || ""}
                            onChange={(e) => setRewardForm({
                              ...rewardForm,
                              specialOffer: { ...rewardForm.specialOffer, buyProductId: e.target.value },
                            })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Produit Gratuit *</label>
                          <select
                            value={rewardForm.specialOffer.getProductId || ""}
                            onChange={(e) => setRewardForm({
                              ...rewardForm,
                              specialOffer: { ...rewardForm.specialOffer, getProductId: e.target.value },
                            })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Minimum Requis *</label>
                      <input
                        type="number"
                        value={rewardForm.specialOffer.minPoints}
                        onChange={(e) => setRewardForm({
                          ...rewardForm,
                          specialOffer: { ...rewardForm.specialOffer, minPoints: e.target.value },
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                )}

                {rewardForm.type === "customOffer" && (
                  <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l'Offre *</label>
                      <input
                        type="text"
                        value={rewardForm.customTitle || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customTitle: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Offre Spéciale du Mois"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description Personnalisée *</label>
                      <textarea
                        value={rewardForm.customDescription || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customDescription: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Profitez de 10% de réduction sur tout achat de plus de 50€ ce week-end !"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conditions (optionnel)</label>
                      <textarea
                        value={rewardForm.customTerms || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customTerms: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ex: Offre valable uniquement en magasin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Minimum (optionnel)</label>
                      <input
                        type="number"
                        value={rewardForm.customMinPoints || ""}
                        onChange={(e) => setRewardForm({ ...rewardForm, customMinPoints: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        placeholder="Ex: 100"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">📅 Période de Validité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de Début *</label>
                      <input
                        type="date"
                        value={rewardForm.startDate}
                        onChange={(e) => setRewardForm({ ...rewardForm, startDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de Fin *</label>
                      <input
                        type="date"
                        value={rewardForm.endDate}
                        onChange={(e) => setRewardForm({ ...rewardForm, endDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRewardModal(false);
                      setEditingReward(null);
                    }}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                  >
                    <span>✓</span>
                    Sauvegarder
                  </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)}
{activeSection === "stock" && (
  <div className="bg-white p-4 rounded-md shadow-md">
    <h2 className="text-xl font-semibold mb-4">Gestion des Stocks</h2>
    
    {/* Formulaire d'ajout de produit */}
    <form onSubmit={handleAddProduct} className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Nom du produit</label>
        <input
          type="text"
          placeholder="Ex: T-shirt coton"
          value={stockForm.name}
          onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-600">Prix (€)</label>
        <input
          type="number"
          placeholder="Ex: 29.99"
          value={stockForm.price}
          onChange={(e) => setStockForm({ ...stockForm, price: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-600">Catégorie</label>
        <input
          type="text"
          placeholder="Ex: Vêtements"
          value={stockForm.category}
          onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-600">Stock initial</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Ex: 50"
            value={stockForm.stock}
            onChange={(e) => setStockForm({ ...stockForm, stock: e.target.value })}
            className="flex-grow p-2 border rounded focus:ring-2 focus:ring-blue-200"
            min="0"
            required
          />
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
          >
            Ajouter
          </button>
        </div>
      </div>
    </form>

    {/* Outils de gestion */}
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={refreshProducts}
        disabled={isFetchingProducts}
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
      >
        {isFetchingProducts ? (
          <span className="animate-spin">↻</span>
        ) : (
          <span>🔄</span>
        )}
        Rafraîchir
      </button>
      
      <button
        onClick={fetchPremiumStatus}
        className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded text-sm transition-colors"
      >
        🔍 Vérifier statut Premium
      </button>
    </div>

    {/* Liste des produits */}
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Produits en stock ({products.length})</h3>
        <span className="text-sm text-gray-500">
          {products.filter(p => p.premiumAccess).length} produits premium
        </span>
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {Number(product.price).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{product.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleUpdateStock(product._id, e.target.value)}
                      className="w-16 p-1 border rounded text-center focus:ring-1 focus:ring-blue-200"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
  {product.premiumAccess ? (
    <div className="flex flex-col items-center">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✅ Activé
      </span>
      {product.premiumPaymentDate && (
        <span className="text-xs text-gray-500 mt-1">
          {new Date(product.premiumPaymentDate).toLocaleDateString()}
        </span>
      )}
    </div>
  ) : (
    <Elements stripe={stripePromise}>
      <MerchantPremiumPayment 
        productId={product._id}
        merchantId={user.merchantId}
        onSuccess={handlePremiumPaymentSuccess}
        onError={(error) => {
          console.error("Erreur de paiement:", error);
          setMessage(`❌ Échec du paiement: ${error.message || "Erreur de paiement"}`);
        }}
      />
    </Elements>
  )}
</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleProductClick(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Historique"
                    >
                      📊
                    </button>
                    <button
                      onClick={() => forceUpdateProduct(product._id)}
                      className="text-gray-500 hover:text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded"
                      title="Debug"
                    >
                      🔧
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par ajouter votre premier produit.</p>
        </div>
      )}
    </div>

    {/* Notifications */}
    {message && (
      <div className={`p-4 rounded-md mb-6 flex items-start ${
        message.includes("✅") ? "bg-green-50 text-green-800 border border-green-200" :
        message.includes("❌") ? "bg-red-50 text-red-800 border border-red-200" :
        "bg-blue-50 text-blue-800 border border-blue-200"
      }`}>
        <span className="mr-3 text-lg">
          {message.includes("✅") ? "✓" : message.includes("❌") ? "✕" : "ℹ"}
        </span>
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={() => setMessage("")}
          className="ml-4 text-gray-400 hover:text-gray-500"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    )}

    {/* Debug panel (optionnel) */}
    {process.env.NODE_ENV === 'development' && (
      <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Informations techniques</span>
          <span className="text-gray-500">Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>Produits: {products.length}</div>
          <div>Premium: {products.filter(p => p.premiumAccess).length}</div>
          <div>Version: {process.env.REACT_APP_VERSION || 'dev'}</div>
        </div>
      </div>
    )}
  </div>
)}
          {activeSection === "messages" && (
  <div className="bg-white p-4 rounded-md shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">Messagerie Clients</h2>
      <button 
        onClick={() => setActiveSection('')}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <FaTimes className="h-5 w-5 text-gray-500" />
      </button>
    </div>
    
    <form onSubmit={handleSendNotification} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les clients</option>
          {loyalCustomers.map((customer) => (
            <option key={customer.userId} value={customer.userId.toString()}>
              {customer.nom} ({customer.loyaltyPoints} points)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
        <textarea
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          placeholder="Écrivez votre message ici..."
          rows={8}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
        >
          <FaPaperPlane className="h-4 w-4" />
          <span>Envoyer</span>
        </button>
      </div>
    </form>

    {message && (
      <div className={`mt-4 p-3 rounded ${
        message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {message}
      </div>
    )}
  </div>
)}
          
          {message && <div className="text-center p-4 text-red-500">{message}</div>}
        </div>
      </div>
    </div>
  );
}