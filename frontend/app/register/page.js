"use client";

import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import { FaEnvelope, FaLock, FaUser, FaMap, FaCompass, FaGem, FaCrown } from "react-icons/fa";
import Image from "next/image";
import CustomCaptcha from "@/components/CustomCaptcha";
import ReCAPTCHA from "react-google-recaptcha";

export default function Register() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useContext(AuthContext);
  const recaptchaRef = useRef(null);

  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    motDePasse: "",
    confirmPassword: "",
    role: "",
    referralCode: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCustomCaptcha, setShowCustomCaptcha] = useState(false);
  const [isCustomCaptchaVerified, setIsCustomCaptchaVerified] = useState(false);
  const [captchaValidationAttempted, setCaptchaValidationAttempted] = useState(false);

  // Supprimer la redirection ici, car elle est gérée dans AuthContext
  useEffect(() => {
    console.log("État actuel - authLoading:", authLoading, "user:", user);
  }, [user, authLoading]);

  useEffect(() => {
    setForm({
      nom: "",
      email: "",
      motDePasse: "",
      confirmPassword: "",
      role: "",
      referralCode: "",
    });
    setMessage("");
    setShowCustomCaptcha(false);
    setIsCustomCaptchaVerified(false);
    setCaptchaValidationAttempted(false);
    setIsRegister(false);
    setShowForgotPassword(false);

    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      input.value = "";
    });
  }, []);

  useEffect(() => {
    setForm({
      nom: "",
      email: "",
      motDePasse: "",
      confirmPassword: "",
      role: "",
      referralCode: "",
    });
    setMessage("");
    setShowCustomCaptcha(false);
    setIsCustomCaptchaVerified(false);
    setCaptchaValidationAttempted(false);
  }, [isRegister]);

  useEffect(() => {
    if (showForgotPassword) {
      setForm({
        nom: "",
        email: "",
        motDePasse: "",
        confirmPassword: "",
        role: "",
        referralCode: "",
      });
      setMessage("");
    }
  }, [showForgotPassword]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const executeRecaptcha = async () => {
    try {
      if (!recaptchaRef.current) {
        throw new Error("Système de sécurité non initialisé.");
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log("Activation des protections anti-piratage...");
      const token = await recaptchaRef.current.executeAsync();
      clearTimeout(timeoutId);
      recaptchaRef.current.reset();
      console.log("Sécurité validée avec succès :", token);
      return token;
    } catch (error) {
      console.error("Erreur lors de l'activation des protections :", error);
      setMessage(
        error.message.includes("Domaine non valide")
          ? "⚠️ Erreur de sécurité : Territoire non reconnu. Testez avec 'localhost' ou ajoutez '192.168.43.57' aux domaines autorisés."
          : "⚠️ Échec de l'activation des protections : " + error.message
      );
      return null;
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      console.log("Début de l'enregistrement du nouveau chasseur...");
      const recaptchaToken = await executeRecaptcha();
      if (!recaptchaToken) {
        console.log("Échec des vérifications de sécurité");
        setLoading(false);
        return;
      }

      console.log("Envoi des informations d'inscription :", {
        ...form,
        recaptchaToken,
        isCustomCaptchaVerified,
        referralCode: form.referralCode || undefined,
      });

      const response = await registerUser({
        ...form,
        recaptchaToken,
        isCustomCaptchaVerified,
        referralCode: form.referralCode || undefined,
      });

      console.log("Réponse de l'inscription :", response);

      if (response.showCustomCaptcha) {
        setShowCustomCaptcha(true);
        setMessage("🗝️ Défi supplémentaire détecté ! Résolvez l'énigme pour prouver votre valeur.");
        setCaptchaValidationAttempted(true);
        setLoading(false);
        return;
      }

      console.log("Connexion automatique du nouveau chasseur...");
      const loginRes = await loginUser({ email: form.email, motDePasse: form.motDePasse });
      console.log("Réponse de la connexion :", loginRes);

      if (!loginRes.data.user?.userId) {
        throw new Error("Erreur : Identifiant de chasseur manquant dans la réponse");
      }

      login(loginRes.data.token, loginRes.data.user);
      localStorage.setItem("userId", loginRes.data.user.userId);
      console.log("ID de chasseur enregistré :", localStorage.getItem("userId"));

      if (form.referralCode && response.referredBy && response.referrerName) {
        localStorage.setItem("referrerName", response.referrerName);
      }

      const welcomeMessage =
        loginRes.data.user.role === "admin"
          ? "👑 Bienvenue, Maître des Terres ! Votre règne commence..."
          : "🎉 Bienvenue dans la confrérie des chasseurs de trésor !";

      setMessage(welcomeMessage);
      setTimeout(() => {
        setIsRegister(false);
        setForm({
          nom: "",
          email: "",
          motDePasse: "",
          confirmPassword: "",
          role: "",
          referralCode: "",
        });
        setShowCustomCaptcha(false);
        setIsCustomCaptchaVerified(false);
        setCaptchaValidationAttempted(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'inscription ou de la connexion :", error);
      setMessage("💀 " + (error.message || "Erreur du serveur. La quête a échoué, réessayez."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      if (form.motDePasse !== form.confirmPassword) {
        setMessage("⚔️ Les mots de passe secrets ne correspondent pas.");
        return;
      }

      if (!["client", "marchand"].includes(form.role)) {
        setMessage("🚫 Type de chasseur invalide. Seuls les rôles 'client' ou 'marchand' sont autorisés.");
        return;
      }

      if (showCustomCaptcha && !isCustomCaptchaVerified) {
        setMessage("🗝️ Vous devez résoudre l'énigme pour continuer votre quête.");
        return;
      }

      await handleRegister();
    } else {
      setLoading(true);
      try {
        console.log("Tentative de connexion du chasseur...");
        const res = await loginUser({ email: form.email, motDePasse: form.motDePasse });
        console.log("Réponse de loginUser :", res);

        if (!res.data.user?.userId) {
          throw new Error("Erreur : Identifiant de chasseur manquant");
        }

        login(res.data.token, res.data.user);
        localStorage.setItem("userId", res.data.user.userId);
        console.log("ID de chasseur sauvegardé :", localStorage.getItem("userId"));

        const loginMessage =
          res.data.user.role === "admin"
            ? "👑 Connexion Royale réussie ! Bienvenue dans votre royaume !"
            : "🗺️ Connexion réussie ! Prêt pour l'aventure !";

        setMessage(loginMessage);
      } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        setMessage("💀 " + (error.message || "Erreur du serveur. L'accès au territoire a échoué."));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("http://192.168.43.57:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur lors de l'envoi de la carte de récupération.");
      }

      const data = await response.json();
      setMessage("📜 Une carte de récupération secrète a été envoyée ! Vérifiez votre courrier.");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
      setMessage(
        error.name === "AbortError"
          ? "⏳ Le message s'est perdu en route. Vérifiez votre connexion et réessayez."
          : "💀 " + (error.message || "Erreur du serveur. Le pigeon voyageur a échoué.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 p-4">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧭</div>
          <p className="text-amber-100 text-lg font-semibold">Exploration en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🗺️</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">💎</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">⚓</div>
        <div className="absolute bottom-10 right-10 text-3xl animate-bounce">🏴‍☠️</div>
        <div className="absolute top-1/2 left-5 text-4xl animate-pulse">🧭</div>
        <div className="absolute top-1/3 right-5 text-3xl animate-bounce">⭐</div>
      </div>

      <div className="bg-gradient-to-b from-amber-50 to-yellow-100 border-4 border-amber-600 p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative z-10 backdrop-blur-sm">
        <div className="absolute -top-2 -left-2 text-2xl">🗝️</div>
        <div className="absolute -top-2 -right-2 text-2xl">💰</div>
        <div className="absolute -bottom-2 -left-2 text-2xl">⚔️</div>
        <div className="absolute -bottom-2 -right-2 text-2xl">🏆</div>

        <div className="mb-6">
          <div className="relative">
            <Image
              src="/logo3.png"
              alt="Hani Fidèle - Chasseurs de Trésor"
              width={100}
              height={100}
              className="mx-auto animate-bounce relative z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-amber-900 mb-2">
          {showForgotPassword ? "🗝️ Carte Perdue" : isRegister ? "⚔️ Rejoindre la Confrérie" : "🏴‍☠️ Accès au Territoire"}
        </h1>

        <p className="text-amber-700 text-sm mb-6 italic">
          {showForgotPassword
            ? "Récupérez vos codes d'accès secrets"
            : isRegister
            ? "Devenez un chasseur de trésor légendaire"
            : "Connectez-vous pour commencer votre quête"}
        </p>

        {isRegister && (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            size="invisible"
          />
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="relative group">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
                <input
                  name="nom"
                  type="text"
                  placeholder="Nom de chasseur"
                  value={form.nom}
                  onChange={handleChange}
                  autoComplete="off"
                  className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                  required
                />
              </div>
            )}
            <div className="relative group">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
              <input
                name="email"
                type="email"
                placeholder="📧 Adresse de correspondance"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                required
              />
            </div>
            <div className="relative group">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
              <input
                name="motDePasse"
                type="password"
                placeholder="🔐 Code secret"
                value={form.motDePasse}
                onChange={handleChange}
                autoComplete="new-password"
                className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                required
              />
            </div>
            {isRegister && (
              <div className="relative group">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="🔐 Confirmer le code secret"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                  required
                />
              </div>
            )}
            {isRegister && (
              <div className="relative group">
                <FaGem className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
                <input
                  name="referralCode"
                  type="text"
                  placeholder="💎 Code de parrainage (optionnel)"
                  value={form.referralCode}
                  onChange={handleChange}
                  autoComplete="off"
                  className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                />
              </div>
            )}
            {isRegister && (
              <div className="relative">
                <FaCompass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all appearance-none"
                  required
                >
                  <option value="">⚔️ Choisir votre classe</option>
                  <option value="client">🗡️ Chasseur (Client)</option>
                  <option value="marchand">🏪 Marchand (Vendeur)</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {isRegister && (
              <CustomCaptcha
                showCaptcha={showCustomCaptcha}
                onVerify={(verified) => {
                  setIsCustomCaptchaVerified(verified);
                  if (verified) {
                    setMessage("🎯 Énigme résolue avec brio ! Vous êtes digne de la confrérie !");
                    if (!captchaValidationAttempted) {
                      handleRegister();
                    }
                  } else {
                    setMessage("💀 Vous avez échoué après 3 tentatives. Les gardiens du trésor sont impitoyables...");
                  }
                }}
              />
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 font-bold text-lg shadow-lg transform hover:scale-105 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin text-2xl mr-2">🧭</div>
                  En exploration...
                </span>
              ) : isRegister ? (
                <span className="flex items-center justify-center">
                  ⚔️ Rejoindre la Quête
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  🗺️ Commencer l'Aventure
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="relative group">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
              <input
                name="email"
                type="email"
                placeholder="📧 Votre adresse de correspondance"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 font-bold shadow-lg transform hover:scale-105 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin text-2xl mr-2">🧭</div>
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  📜 Envoyer la Carte de Récupération
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-amber-700 font-semibold hover:text-amber-900 hover:underline transition-all duration-200 mt-2"
            >
              ↩️ Retour au territoire
            </button>
          </form>
        )}

        {!showForgotPassword && (
          <>
            {!isRegister && (
              <p className="mt-2 text-center text-amber-700">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-amber-800 font-semibold hover:text-amber-900 hover:underline transition-all duration-200"
                >
                  🗝️ Carte d'accès perdue ?
                </button>
              </p>
            )}
            <p className="mt-4 text-center text-amber-700">
              {isRegister ? "Déjà membre de la confrérie ?" : "Nouveau chasseur ?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-amber-800 font-semibold hover:text-amber-900 hover:underline transition-all duration-200"
              >
                {isRegister ? "🏴‍☠️ Accéder au territoire" : "⚔️ Rejoindre l'aventure"}
              </button>
            </p>
          </>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-semibold ${
              message.includes("réussie") ||
              message.includes("envoyé") ||
              message.includes("succès") ||
              message.includes("Bienvenue") ||
              message.includes("brio") ||
              message.includes("Royale")
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}