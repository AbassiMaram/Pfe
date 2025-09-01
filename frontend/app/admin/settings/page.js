"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { FaCog, FaArrowLeft, FaSave, FaDatabase, FaShieldAlt, FaUsers, FaGem } from "react-icons/fa";

export default function AdminSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    loyaltyPointsPerScan: 100,
    loyaltyPointsPerReferral: 500,
    minimumPointsForReward: 1000,
    maxBadgesPerUser: 10,
    systemMaintenance: false,
    enableRegistration: true,
    enableReferralSystem: true,
    treasureHuntEnabled: true,
    puzzleGameEnabled: true,
    memoryGameEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Vérification des droits d'accès
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/register");
    }
  }, [user, authLoading, router]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Simule une sauvegarde des paramètres
      // Dans une vraie application, vous feriez un appel API ici
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage("Paramètres sauvegardés avec succès !");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erreur lors de la sauvegarde des paramètres.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-purple-100 text-lg font-semibold">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/admin")}
          className="text-white mb-6 flex items-center gap-2 hover:text-purple-300 transition-colors"
        >
          <FaArrowLeft /> Retour au tableau de bord
        </button>

        <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-xl p-6 mb-6 shadow-2xl border-2 border-purple-600">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FaCog className="text-yellow-400" />
            Paramètres du Royaume
          </h1>
          <p className="text-purple-200 mt-2">
            Configuration avancée du système Hani Fidèle
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes("succès") ? "bg-green-600" : "bg-red-600"} text-white`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres de fidélité */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border-2 border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaGem className="text-yellow-400" />
              Système de Fidélité
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 mb-2">Points par scan QR</label>
                <input
                  type="number"
                  value={settings.loyaltyPointsPerScan}
                  onChange={(e) => handleSettingChange("loyaltyPointsPerScan", parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-purple-300 mb-2">Points par parrainage</label>
                <input
                  type="number"
                  value={settings.loyaltyPointsPerReferral}
                  onChange={(e) => handleSettingChange("loyaltyPointsPerReferral", parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-purple-300 mb-2">Points minimum pour récompense</label>
                <input
                  type="number"
                  value={settings.minimumPointsForReward}
                  onChange={(e) => handleSettingChange("minimumPointsForReward", parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-purple-300 mb-2">Nombre maximum de badges par utilisateur</label>
                <input
                  type="number"
                  value={settings.maxBadgesPerUser}
                  onChange={(e) => handleSettingChange("maxBadgesPerUser", parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Paramètres système */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border-2 border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-blue-400" />
              Paramètres Système
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-purple-300">Mode maintenance</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemMaintenance}
                    onChange={(e) => handleSettingChange("systemMaintenance", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-300">Inscription activée</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableRegistration}
                    onChange={(e) => handleSettingChange("enableRegistration", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-300">Système de parrainage</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableReferralSystem}
                    onChange={(e) => handleSettingChange("enableReferralSystem", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-300">Chasse au trésor</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.treasureHuntEnabled}
                    onChange={(e) => handleSettingChange("treasureHuntEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-300">Jeu de puzzle</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.puzzleGameEnabled}
                    onChange={(e) => handleSettingChange("puzzleGameEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-300">Jeu de mémoire</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.memoryGameEnabled}
                    onChange={(e) => handleSettingChange("memoryGameEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            <FaSave />
            {loading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
          </button>
        </div>
      </div>
    </div>
  );
}