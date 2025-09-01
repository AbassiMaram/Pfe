"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);

  const playTreasureSound = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Simulation d'un effet sonore
      setTimeout(() => setIsPlaying(false), 800);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background avec texture parchemin */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100"></div>
      
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(139,69,19,0.1),transparent_50%)]"></div>
      
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-pulse opacity-70"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-amber-500 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-yellow-300 rounded-full animate-bounce opacity-70"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6">
        
        {/* Titre avec effet parchemin */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 rounded-lg transform rotate-1 shadow-lg"></div>
          <div className="relative bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 rounded-lg shadow-2xl border-4 border-amber-700">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2 drop-shadow-lg">
              ⚔️ Chasseurs de Trésors ⚔️
            </h1>
            <div className="text-lg text-amber-800 font-semibold">
              Programme de Fidélité Légendaire
            </div>
          </div>
        </div>

        {/* Description avec style aventurier */}
        <div className="bg-amber-50 bg-opacity-80 p-6 rounded-xl border-2 border-amber-600 shadow-lg mb-8 max-w-2xl">
          <p className="text-lg text-amber-900 leading-relaxed">
            🗺️ Embarquez dans une quête épique de fidélité ! Collectez des <span className="font-bold text-yellow-700">pièces d'or</span>, 
            débloquez des <span className="font-bold text-orange-700">trésors exclusifs</span> et gravissez les rangs jusqu'au statut de 
            <span className="font-bold text-amber-800"> Maître Chasseur</span> ! 
          </p>
        </div>

        {/* VOTRE LOGO ORIGINAL - Ne pas toucher ! */}
        <Link href="/register">
          <div className="group cursor-pointer relative" onClick={playTreasureSound}>
            {/* Effet de brillance autour du logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform scale-150"></div>
            
            {/* Animation de pièces autour du logo */}
            {isPlaying && (
              <>
                <div className="absolute top-0 left-0 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full animate-ping animation-delay-150 opacity-75"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 bg-orange-400 rounded-full animate-ping animation-delay-300 opacity-75"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full animate-ping animation-delay-500 opacity-75"></div>
              </>
            )}
            
            <Image 
              src="/logo3.png" 
              alt="Hani Fidèle Logo" 
              width={220} 
              height={220} 
              className="transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 relative z-10" 
            />
          </div>
        </Link>

        {/* Éléments décoratifs */}
        <div className="flex justify-center items-center mt-8 space-x-8 opacity-60">
          <div className="text-2xl animate-bounce">🏴‍☠️</div>
          <div className="text-2xl animate-pulse">⚱️</div>
          <div className="text-2xl animate-bounce animation-delay-300">🗡️</div>
          <div className="text-2xl animate-pulse animation-delay-500">🧭</div>
          <div className="text-2xl animate-bounce animation-delay-700">🦜</div>
        </div>

        {/* Message d'encouragement */}
        <div className="mt-6 text-amber-700 text-sm italic">
          "La fortune sourit aux audacieux, matelot !"
        </div>
      </div>

      {/* Coins décoratifs */}
      <div className="absolute top-4 left-4 text-3xl opacity-30 animate-spin-slow">⚓</div>
      <div className="absolute top-4 right-4 text-3xl opacity-30 animate-spin-slow animation-delay-1000">🏴‍☠️</div>
      <div className="absolute bottom-4 left-4 text-3xl opacity-30 animate-spin-slow animation-delay-500">💰</div>
      <div className="absolute bottom-4 right-4 text-3xl opacity-30 animate-spin-slow animation-delay-1500">🗝️</div>
    </div>
  );
}