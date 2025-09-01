"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircleIcon, StarIcon } from "@heroicons/react/24/solid";

const BadgesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get("userId");
  const orderIdFromQuery = searchParams.get("orderId");
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Badges");

  // Récupérer les badges
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Veuillez vous connecter pour voir vos badges.");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        const response = await fetch("http://192.168.43.57:5000/api/auth/badges", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des badges");
        }

        const data = await response.json();
        setBadges(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBadges();
  }, [router]);

  const navItems = [
    { label: "Points", icon: StarIcon, route: "Points" },
    { label: "Badges", icon: CheckCircleIcon, route: "Badges" },
  ];

  if (loading) return <div className="text-center p-6">Chargement...</div>;
  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E5C5] flex flex-col">
      {/* Contenu principal */}
      <div className="flex-1 p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-[#8B4513] mb-4 text-center">
          Vos Badges
        </h1>

        {badges.length === 0 ? (
          <p className="text-[#8B4513] text-lg text-center">
            Aucun badge disponible pour le moment.
          </p>
        ) : (
          <div className="w-full max-w-2xl">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`w-full p-4 mb-4 rounded-lg shadow flex items-center ${
                  badge.earned ? "bg-[#FFF9E6]" : "bg-[#E0E0E0]"
                }`}
              >
                <CheckCircleIcon
                  className={`h-8 w-8 mr-4 ${
                    badge.earned ? "text-[#FFD700]" : "text-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-lg font-bold text-[#8B4513]">
                    {badge.name}
                  </p>
                  <p className="text-sm text-[#8B4513]">{badge.description}</p>
                  <p
                    className={`text-sm ${
                      badge.earned ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {badge.earned ? "Badge obtenu !" : "Non obtenu"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          Retour
        </button>
      </div>

      {/* Barre de navigation en bas */}
      <div className="bg-[#F5E5C5] border-t border-[#8B4513] flex justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.route}
            onClick={() => {
              setSelectedTab(item.route);
              if (item.route === "Points") {
                router.push(
                  `/rewards?userId=${userIdFromQuery}&orderId=${orderIdFromQuery}`
                );
              }
            }}
            className="flex flex-col items-center"
          >
            <item.icon
              className={`h-6 w-6 ${
                selectedTab === item.route
                  ? "text-[#FFD700]"
                  : "text-[#8B4513]"
              }`}
            />
            <span
              className={`text-sm ${
                selectedTab === item.route
                  ? "text-[#FFD700]"
                  : "text-[#8B4513]"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BadgesPage;