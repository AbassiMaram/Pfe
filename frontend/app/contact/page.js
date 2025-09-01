// app/contact/page.js
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Contact() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shopId) {
      const fetchShop = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/shop/${shopId}`);; // Changement ici : /shops -> /shop
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Boutique introuvable. Vérifiez l'ID de la boutique.");
            }
            throw new Error("Erreur lors de la récupération de la boutique.");
          }
          const data = await response.json();
          setShop(data);
        } catch (err) {
          console.error("Erreur :", err.message);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchShop();
    } else {
      setError("Aucun ID de boutique fourni dans l'URL.");
    }
  }, [shopId]);

  return (
    <div className="container mx-auto p-6 min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      <h1 className="text-3xl font-bold">Contact</h1>
      {loading ? (
        <p className="text-center text-gray-500 mt-4">Chargement...</p>
      ) : error ? (
        <p className="text-center text-red-500 mt-4">{error}</p>
      ) : shop ? (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold">{shop.name}</h2>
          <p className="mt-2">
            <strong>Email :</strong>{" "}
            {shop.contact?.email ? (
              <a href={`mailto:${shop.contact.email}`} className="text-blue-500">
                {shop.contact.email}
              </a>
            ) : (
              "Non disponible"
            )}
          </p>
          <p className="mt-2">
            <strong>Téléphone :</strong>{" "}
            {shop.contact?.phone ? (
              <a href={`tel:${shop.contact.phone}`} className="text-blue-500">
                {shop.contact.phone}
              </a>
            ) : (
              "Non disponible"
            )}
          </p>
          <p className="mt-2">
            <strong>Adresse :</strong>{" "}
            {shop.contact?.address || "Non disponible"}
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">Aucune boutique sélectionnée.</p>
      )}
    </div>
  );
}