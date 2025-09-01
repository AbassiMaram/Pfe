"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Profile() {
  const { id } = useParams(); // ✅ Récupère l'ID depuis l'URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      console.error("❌ ID utilisateur manquant !");
      setError("ID utilisateur manquant.");
      setLoading(false);
      return;
    }

    console.log("🔍 Tentative de récupération du profil :", `http://192.168.43.57:5000/api/user/${id}`);

    fetch(`http://192.168.43.57:5000/api/user/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.message) {
          console.error("❌ Erreur API:", data.message);
          setError(data.message);
        } else {
          console.log("✅ Utilisateur récupéré :", data);
          setUser(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Erreur de récupération du profil :", error);
        setError("Impossible de récupérer le profil.");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-blue-500 text-center mt-10">🔄 Chargement...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">❌ {error}</p>;
  if (!user) return <p className="text-red-500 text-center mt-10">❌ Utilisateur introuvable.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">{user.nom}</h1>
        <p>Email: {user.email}</p>
        {user.qrCode ? (
          <img src={user.qrCode} alt="QR Code" className="mt-4" />
        ) : (
          <p className="text-gray-500">Aucun QR Code disponible.</p>
        )}
      </div>
    </div>
  );
}
