"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import axios from "axios";

export default function ReferralPage() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [loading, user, router]);

  // Récupérer le code de parrainage
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const fetchReferralCode = async () => {
      try {
        const response = await axios.get("http://192.168.43.57:5000/api/auth/referral-code", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReferralCode(response.data.referralCode);
        setReferralLoading(false);
      } catch (err) {
        setReferralError("Erreur lors de la récupération du Code Capitaine : " + err.message);
        setReferralLoading(false);
        console.error(err);
      }
    };

    fetchReferralCode();
  }, [user]);

  // Fonctions pour partager le code
  const message = `Ahoy! Rejoins mon équipage sur Hani Fidèle et gagne 20 pièces d'or avec mon Code Capitaine ${referralCode} ! ⚓🏴‍☠️`;

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaMessenger = () => {
    const url = `https://www.facebook.com/messages/t/?body=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaInstagram = () => {
    const url = `https://www.instagram.com/direct/new/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = async () => {
    if (!recipientEmail) {
      setReferralError("Veuillez entrer une adresse email valide pour recruter ce marin.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setReferralError("Capitaine non authentifié. Veuillez vous reconnecter.");
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.43.57:5000/api/auth/send-referral-email",
        { recipientEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmailSent(true);
      setReferralError(null);
    } catch (err) {
      setReferralError("Erreur lors de l'envoi de l'invitation : " + (err.response?.data?.message || err.message));
      console.error(err);
      if (err.response) {
        console.error("Détails de l'erreur :", err.response.data);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)'}}>
      <p className="text-center text-xl text-amber-100 font-bold">🏴‍☠️ Chargement de la taverne...</p>
    </div>
  );

  return (
    <>
      <Navbar />
      <div 
  className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
 style={{
  background: `
    radial-gradient(circle at 30% 20%, rgba(255,215,0,0.08) 0%, transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(139,69,19,0.12) 0%, transparent 40%),
    linear-gradient(135deg, 
      #2C1810 0%,           /* Brun maritime profond */
      #3E2723 30%,          /* Brun chocolat */
      #5D4037 70%,          /* Terre de Sienne */
      #6D4C41 100%          /* Brun chaud */
    )
  `,
  backgroundAttachment: 'fixed',
  minHeight: '100vh'
}}

>
        {/* Éléments décoratifs flottants */}
        <div className="absolute top-10 left-10 text-4xl animate-bounce opacity-30">⚓</div>
        <div className="absolute top-20 right-20 text-3xl animate-pulse opacity-30">🏴‍☠️</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-spin opacity-30" style={{animationDuration: '10s'}}>🧭</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce opacity-30" style={{animationDelay: '1s'}}>💰</div>

        {/* Carte au trésor principale */}
        <div className="relative max-w-4xl w-full">
          {/* Parchemin avec effet déchiré */}
          <div 
            className="relative p-20 text-center shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500"
            style={{
      backgroundImage: `url('/ayo.png')`, // remplace le chemin si nécessaire
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      clipPath: 'polygon(0% 5%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%)',
      boxShadow: `
        inset 0 0 20px rgba(139,69,19,0.3),
        0 15px 35px rgba(0,0,0,0.4),
        0 5px 15px rgba(0,0,0,0.2)
      `,
      
    }}
          >
           

            {/* Titre avec style pirate */}
<div className="mb-8 ">
  <h1 
    className="text-5xl font-bold text-amber-900 mb-2 drop-shadow-lg -mt-10"
    style={{
      fontFamily: 'serif',
      textShadow: '2px 2px 4px rgba(139,69,19,0.5)'
    }}
  >
    🏴‍☠️ TAVERNE DE RECRUTEMENT ⚓
  </h1>
  <div className="flex justify-center items-center gap-2 text-amber-700">
    <span className="text-2xl">⚔️</span>
    <span className="text-lg font-semibold mt-5">Recherche Équipage pour Grande Expédition</span> {/* décalé en bas */}
    <span className="text-2xl">⚔️</span>
  </div>
</div>


            {referralLoading ? (
              <div className="text-center py-8">
               
                <p className="text-amber-800 text-lg font-semibold">Recherche de votre Code Capitaine dans les archives...</p>
              </div>
            ) : referralError ? (
              <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-semibold">⚠️ {referralError}</p>
              </div>
            ) : (
              <>
              {/* Code Capitaine avec style coffre */}
<div 
  className="mb-10 mt-18 p-2 rounded-lg relative ml-60" // ← DÉCALAGE VERS LA DROITE ICI
  style={{
    width: '300px',
    height: '150px',
    background: 'linear-gradient(145deg, #DAA520, #B8860B)',
    border: '2px solid #8B4513',
    boxShadow: 'inset 0 1px 6px rgba(255,215,0,0.3), 0 2px 8px rgba(0,0,0,0.3)'
  }}
>
  <div className="text-sm text-amber-900 mb-1 font-semibold">
    💎 Votre Code Capitaine 💎
  </div>

  <div 
    className="text-4xl font-bold text-amber-100 mb-2 tracking-wider"
    style={{ textShadow: '2px 2px 1px rgba(0,0,0,0.5)' }}
  >
    {referralCode}
  </div>

  <div className="text-sm text-amber-800">
    🏆 Utilisez ce code pour recruter des marins fidèles ! 🏆
  </div>
</div>


                {/* Message d'invitation */}
                <div className="mb-10 text-center">
                  
                  <p className="text-amber-900 text-lg font-medium leading-relaxed">
                    <strong>Capitaine !</strong> Votre navire a besoin d'un équipage courageux !<br/>
                    <span className="text-amber-700">Recrutez des marins et partagez les richesses découvertes !</span>
                  </p>
                </div>

       {/* Boutons de recrutement stylés */}
<div className="space-y-4">
  <div className="text-center mb-6">
    <h3 className="text-2xl font-bold text-amber-900 mb-2">⚔️ MOYENS DE RECRUTEMENT ⚔️</h3>
    <p className="text-amber-700">Choisissez votre méthode pour rassembler votre équipage :</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
    {/* WhatsApp */}
    <button
      onClick={shareViaWhatsApp}
      className="group font-bold text-white rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-40 h-40 p-4"
      style={{
        background: 'linear-gradient(145deg, #25D366, #128C7E)',
        border: '2px solid #0F6B5C',
        boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
      }}
    >
      <div className="flex flex-col justify-center items-center gap-2 text-center h-full">
        <span className="text-2xl">📱</span>
        <span className="text-sm">Recruter via WhatsApp</span>
        <span className="group-hover:animate-bounce">⚓</span>
      </div>
    </button>

    {/* Instagram */}
    <button
      onClick={shareViaInstagram}
      className="group font-bold text-white rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-40 h-40 p-4"
      style={{
        background: 'linear-gradient(145deg, #E4405F, #C13584)',
        border: '2px solid #A02861',
        boxShadow: '0 4px 15px rgba(228,64,95,0.3)'
      }}
    >
      <div className="flex flex-col justify-center items-center gap-2 text-center h-full">
        <span className="text-2xl">📷</span>
        <span className="text-sm">Recruter via Instagram</span>
        <span className="group-hover:animate-bounce">⚔️</span>
      </div>
    </button>

    {/* Messenger */}
    <button
      onClick={shareViaMessenger}
      className="group font-bold text-white rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-40 h-40 p-4"
      style={{
        background: 'linear-gradient(145deg, #0084FF, #0066CC)',
        border: '2px solid #004499',
        boxShadow: '0 4px 15px rgba(0,132,255,0.3)'
      }}
    >
      <div className="flex flex-col justify-center items-center gap-2 text-center h-full">
        <span className="text-2xl">💬</span>
        <span className="text-sm">Recruter via Messenger</span>
        <span className="group-hover:animate-bounce">🏴‍☠️</span>
      </div>
    </button>

                  <div className="flex flex-col gap-2" style={{ marginLeft: '420px' }}>
  <input
    type="email"
    placeholder="📧 Email du futur marin..."
    value={recipientEmail}
    onChange={(e) => setRecipientEmail(e.target.value)}
    className="p-3 border-2 border-amber-600 rounded-lg text-amber-900 font-medium w-[420px]"
    style={{
      background: 'linear-gradient(145deg, #FFF8DC, #F0E68C)',
      boxShadow: 'inset 0 2px 5px rgba(139,69,19,0.2)'
    }}
  />
  <button
    onClick={shareViaEmail}
    className="group px-6 py-3 font-bold text-white rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl w-[420px]"
    style={{
      background: 'linear-gradient(145deg, #DC143C, #B91C3C)',
      border: '2px solid #991B1B',
      boxShadow: '0 4px 15px rgba(220,20,60,0.3)'
    }}
  >
    <div className="flex items-center justify-center gap-2">
      <span className="text-xl">✉️</span>
      <span>Recruter via Email</span>
      <span className="group-hover:animate-bounce">💰</span>
    </div>
  </button>
</div>

                  </div>
                </div>

                {/* Message de succès stylé */}
                {emailSent && (
                  <div 
                    className="mt-6 p-4 rounded-lg border-2 border-green-600 animate-pulse"
                    style={{
                      background: 'linear-gradient(145deg, #10B981, #059669)',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                    }}
                  >
                    <p className="text-white font-bold text-lg flex items-center justify-center gap-2">
                      <span className="text-2xl">🎉</span>
                      Invitation envoyée avec succès ! Un nouveau marin rejoindra bientôt votre équipage !
                      <span className="text-2xl">🎉</span>
                    </p>
                  </div>
                )}

                {/* Citation pirate en bas */}
<div className="mt-10 pt-6 border-t-2 border-amber-600">
  <p className="text-red-700 font-medium italic text-center">
   
  </p>
</div>

              </>
            )}
          </div>

          {/* X marks the spot - décoratif */}
          <div 
            className="absolute -bottom-4 -right-4 text-6xl text-red-600 animate-pulse opacity-70"
            style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}
          >
            
          </div>
        </div>
        {/* Citation pirate tout en bas de la page */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-amber-200 font-medium italic text-lg px-4">
          💭 "Un capitaine sans équipage n'est qu'un marin perdu en mer..." 💭
        </p>
      </div>
      </div>
    </>
  );
}