"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Edit, Mail, Phone, Calendar, QrCode, Loader2 } from "lucide-react";

export default function MerchantProfilePage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ nom: "", email: "" });
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("🔍 DEBUG - User complet:", user); // Log complet pour diagnostiquer

      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé");
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const minimalProfile = {
        nom: user?.nom || user?.name || "Utilisateur",
        email: user?.email || "Non spécifié",
        role: user?.role || "marchand",
        userId: user?._id || user?.email || "inconnu",
        loyaltyLevel: "Bronze",
        loyaltyPoints: 0,
        totalScans: 0,
        loyaltyProgress: {
          totalPoints: 0,
          purchaseCount: 0,
          uniquePurchaseMonths: 0,
          lastLevelUpdate: new Date().toISOString(),
        },
        badgesEarned: {},
        referrals: [],
        scannedQrCodes: [],
        notifications: [],
      };

      if (!user?._id) {
        console.warn("⚠️ Aucun user._id disponible, utilisation du profil minimal");
        setProfile(minimalProfile);
        setFormData({ nom: minimalProfile.nom, email: minimalProfile.email });
        setError("Certaines données sont manquantes. Les fonctionnalités peuvent être limitées.");
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 DEBUG - Token:", token ? `présent (${token.substring(0, 20)}...)` : "ABSENT");
        console.log("🔍 DEBUG - User ID:", user._id);
        console.log("🔍 DEBUG - User role:", user.role);
        console.log("🔍 DEBUG - User email:", user.email);

        const url = `http://192.168.43.57:5000/api/auth/profile/${user._id}`;
        console.log("🌐 DEBUG - URL complète:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📡 DEBUG - Response status:", response.status);
        console.log("📡 DEBUG - Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("❌ DEBUG - Error response:", errorText);
          throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ DEBUG - Données brutes reçues:", data);

        if (!data) {
          console.warn("⚠️ Données nulles reçues, utilisation du profil par défaut");
          setProfile(minimalProfile);
          setFormData({ nom: minimalProfile.nom, email: minimalProfile.email });
        } else {
          const mergedProfile = {
            nom: data.nom || user.nom || user.name || "Utilisateur",
            email: data.email || user.email || "Non spécifié",
            role: data.role || user.role || "marchand",
            userId: data.userId || data._id || user._id,
            loyaltyLevel: data.loyaltyLevel || "Bronze",
            loyaltyPoints: data.loyaltyPoints || 0,
            totalScans: data.totalScans || 0,
            loyaltyProgress: {
              totalPoints: data.loyaltyProgress?.totalPoints || 0,
              purchaseCount: data.loyaltyProgress?.purchaseCount || 0,
              uniquePurchaseMonths: data.loyaltyProgress?.uniquePurchaseMonths || 0,
              lastLevelUpdate: data.loyaltyProgress?.lastLevelUpdate || new Date().toISOString(),
            },
            badgesEarned: data.badgesEarned || {},
            referrals: data.referrals || [],
            scannedQrCodes: data.scannedQrCodes || [],
            notifications: data.notifications || [],
            qrCode: data.qrCode || null,
          };
          setProfile(mergedProfile);
          setFormData({ nom: mergedProfile.nom, email: mergedProfile.email });
          console.log("✅ DEBUG - Profil fusionné créé:", mergedProfile);
        }
      } catch (error) {
        console.error("❌ Erreur fetch profile:", error);
        setError("Impossible de charger toutes les données du profil.");
        setProfile(minimalProfile);
        setFormData({ nom: minimalProfile.nom, email: minimalProfile.email });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleProfileOption = (option) => {
    if (option === "edit") {
      setEditMode(true);
    } else if (option === "logout") {
      localStorage.removeItem("token");
      router.push("/login");
    }
    setShowProfileMenu(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setUpdateStatus({ type: "error", message: "Session expirée. Veuillez vous reconnecter." });
      return;
    }

    // Utiliser user._id ou profile.userId comme fallback
    const userId = user?._id || profile?.userId;
    if (!userId || userId === "inconnu") {
      setUpdateStatus({
        type: "error",
        message: "Impossible de modifier le profil : identifiant utilisateur manquant. Essayez de vous reconnecter.",
      });
      return;
    }

    try {
      const response = await fetch(`http://192.168.43.57:5000/api/auth/profile/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nom: formData.nom, email: formData.email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const updatedData = await response.json();
      setProfile((prev) => ({
        ...prev,
        nom: updatedData.nom || formData.nom,
        email: updatedData.email || formData.email,
        userId: updatedData._id || userId,
      }));
      setUpdateStatus({ type: "success", message: "Profil mis à jour avec succès !" });
      setEditMode(false);
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error("❌ Erreur mise à jour profil:", error);
      setUpdateStatus({ type: "error", message: "Erreur lors de la mise à jour: " + error.message });
    }
  };

  const handleCancelEdit = () => {
    setFormData({ nom: profile.nom, email: profile.email });
    setEditMode(false);
    setUpdateStatus(null);
  };

  if (!user || user.role !== "marchand") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Accès réservé aux marchands uniquement</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    console.error("❌ ERREUR CRITIQUE - Aucun profil disponible");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600">Erreur critique - Impossible de charger le profil</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const joinDate = profile.loyaltyProgress?.lastLevelUpdate
    ? new Date(profile.loyaltyProgress.lastLevelUpdate).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date non disponible";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec menu profil */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenue, {profile.nom || "Utilisateur"} !
              </h1>
              
            </div>

           
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Section profil principal */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(profile.nom || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{profile.nom}</h2>
                  <p className="text-gray-600 capitalize">{profile.role}</p>
                  <p className="text-gray-500">ID: {profile.userId}</p>
                  <div className="mt-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      {profile.loyaltyLevel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Mail size={20} className="text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Phone size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span className="hidden sm:block">Modifier</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations personnelles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Informations Personnelles</h3>
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Edit size={16} />
                    <span>Modifier</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {updateStatus && (
                      <div
                        className={`p-3 rounded-lg ${
                          updateStatus.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {updateStatus.message}
                        {updateStatus.type === "error" && updateStatus.message.includes("identifiant utilisateur manquant") && (
                          <button
                            onClick={() => router.push("/login")}
                            className="ml-2 text-blue-600 underline hover:text-blue-800"
                          >
                            Se reconnecter
                          </button>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom</label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{profile.nom}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID Utilisateur</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{profile.userId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rôle</label>
                        <p className="mt-1 text-lg text-gray-900 capitalize">{profile.role}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations compte */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Informations Compte</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Dernière mise à jour</label>
                  <p className="mt-1 text-gray-900 flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{joinDate}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">QR Codes scannés</label>
                  <p className="mt-1 text-gray-900">{profile.scannedQrCodes?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {profile.qrCode && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">QR Code Personnel</h3>
                </div>

                <div className="p-6 text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                    <img
                      src={profile.qrCode}
                      alt="QR Code Personnel"
                      className="w-32 h-32 mx-auto"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <div
                      style={{ display: "none" }}
                      className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                    >
                      QR Code indisponible
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">Votre QR Code unique</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}