"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user, loading, updateUser } = useContext(AuthContext);
  const router = useRouter();
  const [showTreasureGlow, setShowTreasureGlow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: ""
  });
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }

    if (user) {
      setFormData({
        nom: user.nom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        adresse: user.adresse || ""
      });
    }

    // Animation de lueur
    setShowTreasureGlow(true);
    const timer = setInterval(() => {
      setShowTreasureGlow(prev => !prev);
    }, 3000);

    return () => clearInterval(timer);
  }, [loading, user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSaveChanges = async () => {
  setIsUpdating(true);
  
  try {
    // 1. Récupération de l'ID utilisateur (version simplifiée)
    const userId = user?._id || localStorage.getItem('userId');
    
    if (!userId) {
      alert("Veuillez vous reconnecter");
      return router.push("/login");
    }

    // 2. Envoi de la requête
    const response = await fetch(`http://192.168.43.57:5000/api/auth/profile/${userId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(formData)
    });

    // 3. Traitement de la réponse
    const data = await response.json();
    
    if (response.ok) {
      // Mise à jour MANUELLE des données sans utiliser updateUser
      setFormData(prev => ({
        ...prev,
        nom: data.nom || prev.nom,
        email: data.email || prev.email
      }));
      
      setSuccessMessage("Profil mis à jour !");
      setIsEditing(false);
    } else {
      throw new Error(data.message || "Erreur serveur");
    }

  } catch (error) {
    alert(`Erreur: ${error.message}`);
  } finally {
    setIsUpdating(false);
  }
};
  const cancelEdit = () => {
    setFormData({
      nom: user?.nom || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
      adresse: user?.adresse || ""
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-800 to-yellow-800">
        <div className="text-center p-8">
          <div className="text-6xl mb-4 animate-spin">⚓</div>
          <p className="text-xl text-yellow-300 animate-pulse">
            Chargement de votre profil de pirate...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-yellow-800 overflow-hidden relative">
      {/* Étoiles scintillantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-200 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${Math.random() * 8 + 4}px`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Particules dorées flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-400 text-2xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            ✦
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Message de succès */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl border-2 border-green-400/50 animate-bounce">
              {successMessage}
            </div>
          </div>
        )}

        {/* Titre principal */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-5xl animate-bounce">🏴‍☠️</div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-400 drop-shadow-2xl">
              PROFIL DE PIRATE
            </h1>
            <div className="text-5xl animate-bounce" style={{ animationDelay: "0.5s" }}>🏴‍☠️</div>
          </div>
          <p className="text-lg text-yellow-100 drop-shadow-lg">
            ⚓ Vos informations de corsaire ⚓
          </p>
        </div>

        {/* Carte de profil */}
        <div className="relative">
          {/* Effet de lueur */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-500/30 to-orange-500/20 blur-2xl scale-110 transition-opacity duration-2000 ${showTreasureGlow ? 'opacity-100' : 'opacity-60'}`}></div>
          
          <div className="relative bg-gradient-to-br from-slate-900/80 via-amber-900/60 to-yellow-900/70 backdrop-blur-xl border-2 border-yellow-400/50 p-8 rounded-3xl shadow-2xl w-full max-w-md">
            {/* Avatar de pirate */}
            <div className="text-center mb-6">
              <div className="inline-block relative">
                <div className="text-8xl mb-2">👨‍🏴‍☠️</div>
                <div className="absolute -top-2 -right-2 text-3xl animate-bounce">👑</div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -bottom-2 -right-2 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 border-2 border-yellow-400/50"
                    title="Modifier le profil"
                  >
                    <span className="text-lg">✏️</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mode Affichage */}
            {!isEditing && (
              <div className="space-y-4 text-center">
                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <p className="text-yellow-300 font-semibold text-sm mb-1">🏴‍☠️ NOM DE CORSAIRE</p>
                  <p className="text-yellow-100 text-xl font-bold">{user?.nom}</p>
                </div>

                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <p className="text-yellow-300 font-semibold text-sm mb-1">📧 MESSAGERIE SECRÈTE</p>
                  <p className="text-yellow-100 text-lg break-all">{user?.email}</p>
                </div>

                {user?.telephone && (
                  <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                    <p className="text-yellow-300 font-semibold text-sm mb-1">📞 SIGNAL DE DÉTRESSE</p>
                    <p className="text-yellow-100 text-lg">{user?.telephone}</p>
                  </div>
                )}

                {user?.adresse && (
                  <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                    <p className="text-yellow-300 font-semibold text-sm mb-1">🏝️ PORT D'ATTACHE</p>
                    <p className="text-yellow-100 text-lg">{user?.adresse}</p>
                  </div>
                )}

                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <p className="text-yellow-300 font-semibold text-sm mb-1">⚔️ RANG PIRATE</p>
                  <p className="text-yellow-100 text-xl font-bold uppercase">
                    {user?.role === 'admin' ? '🏴‍☠️ CAPITAINE' : '⚓ MATELOT'}
                  </p>
                </div>
              </div>
            )}

            {/* Mode Édition */}
            {isEditing && (
              <div className="space-y-4">
                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <label className="text-yellow-300 font-semibold text-sm mb-2 block">🏴‍☠️ NOM DE CORSAIRE</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/70 border border-yellow-500/50 rounded-xl p-3 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="Votre nom de pirate..."
                  />
                </div>

                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <label className="text-yellow-300 font-semibold text-sm mb-2 block">📧 MESSAGERIE SECRÈTE</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/70 border border-yellow-500/50 rounded-xl p-3 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="capitaine@navire.com"
                  />
                </div>

                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <label className="text-yellow-300 font-semibold text-sm mb-2 block">📞 SIGNAL DE DÉTRESSE</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/70 border border-yellow-500/50 rounded-xl p-3 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>

                <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30">
                  <label className="text-yellow-300 font-semibold text-sm mb-2 block">🏝️ PORT D'ATTACHE</label>
                  <textarea
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full bg-slate-800/70 border border-yellow-500/50 rounded-xl p-3 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 resize-none"
                    placeholder="Votre adresse de port d'attache..."
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-3 rounded-full font-bold text-sm shadow-2xl transform hover:scale-105 disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-green-400/30"
                  >
                    {isUpdating ? (
                      <>
                        <span className="text-lg animate-spin">⚓</span>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <span className="text-lg">💾</span>
                        Sauvegarder
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={cancelEdit}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:via-rose-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-3 rounded-full font-bold text-sm shadow-2xl transform hover:scale-105 disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-red-400/30"
                  >
                    <span className="text-lg">❌</span>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* QR Code - toujours affiché */}
            {user?.qrCode && (
              <div className="bg-amber-900/30 backdrop-blur-sm p-4 rounded-2xl border border-yellow-500/30 mt-4">
                <p className="text-yellow-300 font-semibold text-sm mb-3 text-center">🗝️ VOTRE CLÉ SECRÈTE</p>
                <div className="relative inline-block w-full text-center">
                  <img 
                    src={user.qrCode} 
                    alt="QR Code Pirate" 
                    className="w-32 h-32 mx-auto rounded-xl border-2 border-yellow-400/50 bg-white/90 p-2"
                  />
                  <div className="absolute -top-2 -right-2 text-2xl">🔐</div>
                </div>
                <p className="text-yellow-200 text-xs mt-2 italic text-center">
                  "Gardez précieusement cette clé !"
                </p>
              </div>
            )}

            {/* Bouton retour */}
            <div className="text-center mt-8">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-700 hover:via-yellow-700 hover:to-amber-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto border-2 border-yellow-400/30"
              >
                <span className="text-xl">🚢</span>
                Retour au Navire
                <span className="text-xl">🚢</span>
              </button>
            </div>
          </div>
        </div>

        {/* Citation de pirate */}
        <div className="mt-8 text-center">
          <p className="text-yellow-200/80 italic text-lg max-w-md">
            {isEditing ? 
              "Un vrai pirate met à jour ses cartes pour ne jamais perdre son chemin !" :
              "Un vrai pirate garde toujours ses trésors secrets et ses amis encore plus secrets !"
            }
          </p>
          <p className="text-yellow-400/60 text-sm mt-2">- Proverbe des Sept Mers</p>
        </div>
      </div>
    </div>
  );
}