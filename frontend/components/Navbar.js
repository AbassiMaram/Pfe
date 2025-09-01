"use client";

import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBell } from "react-icons/fa";
import Image from "next/image";
import axios from "axios";

const API_URL = "http://192.168.43.57:5000/api/auth";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [imageError, setImageError] = useState(false);

  const fetchNotifications = async () => {
    if (user && user.token) {
      console.log("Token utilisé pour la requête API :", user.token);
      try {
        const response = await axios.get(`${API_URL}/get-notifications`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        console.log("Notifications récupérées :", response.data);
        setNotifications(response.data.notifications || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications :", error.response?.data || error.message);
      }
    } else {
      console.log("Utilisateur ou token non disponible :", { user });
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${API_URL}/mark-notification-as-read`,
        { notificationId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.post(
        `${API_URL}/delete-notification`,
        { notificationId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(notifications.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  return (
    <nav 
      className="relative p-6 shadow-2xl border-b-4 border-amber-600"
      style={{ 
        background: 'linear-gradient(135deg, #D4A574 0%, #C19A6B 50%, #A0845C 100%)',
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23654321' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 0 8-8 8-8s8 8 8 8-8 8-8 8-8-8-8-8zM4 4c0 0 8-8 8-8s8 8 8 8-8 8-8 8-8-8-8-8z'/%3E%3C/g%3E%3C/svg%3E"),
          radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%)
        `,
        backgroundSize: '40px 40px, 100% 100%, 100% 100%'
      }}
    >
      {/* Bordure décorative en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
      
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo avec z-index élevé */}
        <Link href="/dashboard" className="relative z-50 transform hover:scale-105 transition-transform duration-300">
          <div className="relative">
            {!imageError ? (
              <Image
                src="/logo3.png"
                alt="Hani Fidèle Logo"
                width={120}
                height={48}
                className="cursor-pointer drop-shadow-lg"
                onError={(e) => {
                  console.error("Erreur de chargement de l'image logo3.png");
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log("Logo chargé avec succès");
                }}
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
            ) : (
              <div className="w-[120px] h-[48px] bg-amber-200 rounded-lg flex items-center justify-center border-2 border-amber-600 shadow-lg">
                <span className="text-amber-800 font-bold text-lg">HANI FIDÈLE</span>
              </div>
            )}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        </Link>

        {/* Menu de navigation avec z-index plus bas */}
        <div className="flex items-center space-x-1 relative z-10">
          {user && (
            <>
              <Link 
                href="/dashboard" 
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">🏝️</span>
                  <span className="text-xl font-bold">Accueil</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
              
              <Link 
                href="/shop" 
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">🛡️</span>
                  <span className="text-xl font-bold">Achats</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
              
              <Link 
                href="/loyalty" 
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">💰</span>
                  <span className="text-xl font-bold">Points</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
              
              <Link 
                href="/referral" 
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">🤝</span>
                  <span className="text-xl font-bold">Parrainage</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
              
              <Link 
                href="/loyalty-level" 
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">🌟</span>
                  <span className="text-xl font-bold">Niveau</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
              
              <Link
                href="/game"
                className="group relative px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-3xl">🗺️</span>
                  <span className="text-xl font-bold">Jeux</span>
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-amber-800 group-hover:w-full transition-all duration-300"></div>
              </Link>
            </>
          )}
        </div>

        {/* Section utilisateur avec z-index intermédiaire */}
        <div className="flex items-center space-x-3 relative z-20">
          {user && (
            <div className="relative">
              {/* Cloche de notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-amber-800 hover:text-amber-900 transition-colors duration-300 rounded-full hover:bg-amber-200/30 backdrop-blur-sm"
              >
                <FaBell className="text-2xl drop-shadow-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Panel des notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-2xl rounded-xl p-4 z-50 border-2 border-amber-200 backdrop-blur-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-green-800 flex items-center">
                      <span className="mr-2">🔔</span>
                      Notifications
                    </h3>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-gray-600">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            notif.read 
                              ? "bg-gray-100 border-gray-300" 
                              : "bg-gradient-to-r from-yellow-100 to-amber-100 border-amber-400 shadow-md"
                          } transition-all duration-300`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-green-800 font-medium">{notif.message}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(notif.date).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-2">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-amber-600 text-xs hover:text-amber-800 hover:underline transition-colors duration-200"
                                >
                                  ✓ Lu
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className="text-red-500 text-xs hover:text-red-700 hover:underline transition-colors duration-200"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {user ? (
            <>
              <Link 
                href="/profile" 
                className="flex items-center space-x-2 px-4 py-3 text-amber-900 hover:text-amber-800 transition-all duration-300 rounded-lg hover:bg-amber-200/30 backdrop-blur-sm border border-transparent hover:border-amber-600/30 font-bold"
              >
                <span className="text-3xl">👤</span>
                <span className="text-xl font-bold">Profil</span>
              </Link>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-3 text-amber-900 border-2 border-amber-700 rounded-lg hover:bg-amber-700 hover:text-amber-100 transition-all duration-300 font-bold shadow-lg hover:shadow-amber-700/25 transform hover:scale-105"
              >
                <span className="text-3xl">⚓</span>
                <span className="text-xl font-bold">Déconnexion</span>
              </button>
            </>
          ) : (
            <Link 
              href="/register" 
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 font-bold shadow-lg hover:shadow-amber-700/25 transform hover:scale-105"
            >
              <span className="text-3xl">🚪</span>
              <span className="text-xl font-bold">Connexion</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Bordure décorative en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700"></div>
    </nav>
  );
}