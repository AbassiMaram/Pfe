"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLock } from "react-icons/fa";
import Image from "next/image";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Récupère le token depuis l'URL

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordValid, setPasswordValid] = useState(false); // État pour suivre la validité du mot de passe

  useEffect(() => {
    if (!token) {
      setMessage("❌ Token manquant. Veuillez utiliser le lien envoyé par email.");
    }
  }, [token]);

  // Fonction pour valider le mot de passe en temps réel
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Si le champ modifié est newPassword, valider en temps réel
    if (name === "newPassword") {
      setPasswordValid(validatePassword(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(form.newPassword)) {
      newErrors.newPassword =
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.";
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Mot de passe réinitialisé avec succès ! Redirection vers la connexion...");
        setTimeout(() => router.push("/register"), 3000); // Redirige après 3 secondes
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Erreur serveur. Veuillez réessayer.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 p-4 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🗺️</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">💎</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">⚓</div>
        <div className="absolute bottom-10 right-10 text-3xl animate-bounce">🏴‍☠️</div>
        <div className="absolute top-1/2 left-5 text-4xl animate-pulse">🧭</div>
        <div className="absolute top-1/3 right-5 text-3xl animate-bounce">⭐</div>
      </div>

      <div className="bg-gradient-to-b from-amber-50 to-yellow-100 border-4 border-amber-600 p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative z-10 backdrop-blur-sm">
        {/* Coins décoratifs */}
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

        <h1 className="text-3xl font-bold text-amber-900 mb-2">🗝️ Déverrouiller le Trésor</h1>
        
        <p className="text-amber-700 text-sm mb-6 italic">
          Récupérez votre accès secret pour reprendre la quête
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
            <input
              name="newPassword"
              type="password"
              placeholder="🔐 Nouveau code secret"
              value={form.newPassword}
              onChange={handleChange}
              className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
              required
            />
            {/* Message de validation en temps réel */}
            <p
              className={`text-sm mt-1 ${
                passwordValid ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordValid
                ? "✅ Mot de passe acceptable"
                : "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."}
            </p>
            {errors.newPassword && !passwordValid && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>
          <div className="relative group">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 group-hover:text-amber-800 transition-colors" />
            <input
              name="confirmPassword"
              type="password"
              placeholder="🔐 Confirmer le code secret"
              value={form.confirmPassword}
              onChange={handleChange}
              className="pl-10 p-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full bg-amber-50 hover:bg-amber-100 transition-all"
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 font-bold text-lg shadow-lg transform hover:scale-105 active:scale-95"
            disabled={loading || !token}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin text-2xl mr-2">🧭</div>
                En exploration...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                🗝️ Déverrouiller l'accès
              </span>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-amber-700">
          Retour à la{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-amber-800 font-semibold hover:text-amber-900 hover:underline transition-all duration-200"
          >
            carte du territoire
          </button>
        </p>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${
            message.includes("succès") || message.includes("réinitialisé")
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}