"use client";

import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Trophy, Clock, Target, Star, Shuffle, RotateCcw } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [seasonalBaskets, setSeasonalBaskets] = useState([]);
  const [shopNames, setShopNames] = useState({});
  const [basketLoading, setBasketLoading] = useState(true);
  const [basketError, setBasketError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [merchantIdToShopId, setMerchantIdToShopId] = useState({});
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameState, setGameState] = useState({ question: null, score: 0 });
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memorySequence, setMemorySequence] = useState([]);
  const [memoryUserInput, setMemoryUserInput] = useState([]);
  const [memoryIsPlaying, setMemoryIsPlaying] = useState(false);
  const [memoryActiveTile, setMemoryActiveTile] = useState(null);
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [puzzleState, setPuzzleState] = useState({
    level: 'beginner',
    grid: [],
    emptyPos: { row: 2, col: 2 },
    moves: 0,
    timer: 0,
    isPlaying: false,
    isComplete: false,
    score: 0
  });
  const [playerStats, setPlayerStats] = useState({
    beginnerWins: 0,
    intermediateWins: 0,
    expertWins: 0,
    dailyStreak: 0,
    totalScore: 0
  });

  const defaultImageUrl = "https://via.placeholder.com/150?text=Image+Non+Disponible";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const referrerName = localStorage.getItem("referrerName");
    if (referrerName) {
      setWelcomeMessage(`Bienvenue de la part de ${referrerName} !`);
      localStorage.removeItem("referrerName");
      setTimeout(() => {
        setWelcomeMessage("");
      }, 5000);
    }
  }, [user]);

  useEffect(() => {
    const fetchSeasonalBaskets = async () => {
      if (!user) return;

      try {
        setBasketLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/merchant/seasonal-baskets?all=true`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur API seasonal-baskets:", errorText);
          throw new Error("Erreur lors de la récupération des paniers saisonniers");
        }

        const data = await response.json();
        const baskets = data.baskets || [];
        
        const processedBaskets = [];
        const promotionGroups = {};
        
        baskets.forEach(basket => {
          if (basket.type === 'promotion') {
            const endDate = new Date(basket.endDate);
            const normalizedDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            const groupKey = `${basket.merchantId}_${normalizedDate}`;
            
            if (!promotionGroups[groupKey]) {
              promotionGroups[groupKey] = {
                ...basket,
                _id: `grouped_${groupKey}`,
                items: [...(basket.items || basket.productIds || [])],
                isGrouped: true,
                groupedPromotions: [basket],
                totalItems: (basket.items || basket.productIds || []).length
              };
            } else {
              const existingGroup = promotionGroups[groupKey];
              existingGroup.items = [...existingGroup.items, ...(basket.items || basket.productIds || [])];
              existingGroup.groupedPromotions.push(basket);
              existingGroup.totalItems = existingGroup.items.length;
              if (new Date(basket.endDate) > new Date(existingGroup.endDate)) {
                existingGroup.endDate = basket.endDate;
              }
            }
          } else {
            processedBaskets.push(basket);
          }
        });
        
        Object.values(promotionGroups).forEach(group => {
          processedBaskets.push(group);
        });
        
        setSeasonalBaskets(processedBaskets);

        const merchantIds = [...new Set(processedBaskets.map((basket) => basket.merchantId))];
        const shopIds = {};
        const shopNamesData = {};

        if (merchantIds.length > 0) {
          for (const merchantId of merchantIds) {
            try {
              const shopResponse = await fetch(
                `http://localhost:5000/api/shops/by-merchant?merchantId=${merchantId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              if (shopResponse.ok) {
                const shopData = await shopResponse.json();
                const shopId = shopData._id;
                shopIds[merchantId] = shopId;
                shopNamesData[shopId] = shopData.name || `Boutique ${merchantId}`;
              } else {
                shopNamesData[merchantId] = `Boutique ${merchantId}`;
              }
            } catch (err) {
              console.error(`Erreur récupération boutique ${merchantId}:`, err);
              shopNamesData[merchantId] = `Boutique ${merchantId}`;
            }
          }
        }

        setShopNames(shopNamesData);
        setMerchantIdToShopId(shopIds);
      } catch (err) {
        console.error("Erreur lors de la récupération des paniers:", err);
        setBasketError("❌ Impossible de charger les offres saisonnières.");
      } finally {
        setBasketLoading(false);
      }
    };

    if (user) {
      fetchSeasonalBaskets();
    }
  }, [user]);

  const openModal = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const openOfferModal = (offer) => {
    setSelectedOffer(offer);
  };

  const closeOfferModal = () => {
    setSelectedOffer(null);
  };

  const claimSpecialOffer = async (offerId) => {
    try {
      setBasketLoading(true);
      const response = await fetch(`http://localhost:5000/api/merchant/claim-special-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ offerId, userId: user._id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message || "Offre réclamée avec succès !");
        const updatedResponse = await fetch(
          `http://localhost:5000/api/merchant/seasonal-baskets?userId=${user._id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setSeasonalBaskets(updatedData.baskets || []);
        }
      } else {
        setBasketError(data.message || "❌ Échec de la réclamation de l'offre.");
        alert(data.message || "❌ Échec de la réclamation de l'offre.");
      }
    } catch (err) {
      console.error("Erreur lors de la réclamation :", err);
      setBasketError("❌ Impossible de réclamer l'offre.");
      alert("❌ Impossible de réclamer l'offre.");
    } finally {
      setBasketLoading(false);
      closeOfferModal();
    }
  };

  const getOfferTitle = (basket) => {
    switch(basket.type) {
      case "promotion":
        return "Promotion";
      case "specialOffer":
        return "Offre Spéciale";
      case "customOffer":
        return basket.customOffer?.title || "Offre Personnalisée";
      case "seasonal_liquidation":
        return "Liquidation";
      default:
        return "Offre";
    }
  };

  const getOfferEmoji = (basket) => {
    switch(basket.type) {
      case "promotion":
        return "🏷️";
      case "specialOffer":
        return "🎁";
      case "customOffer":
        return "✨";
      case "seasonal_liquidation":
        return "🔥";
      default:
        return "🎀";
    }
  };

  const getOfferSummary = (basket) => {
    switch(basket.type) {
      case "promotion":
        const itemCount = basket.items?.length || basket.productIds?.length || 0;
        return `${itemCount} article${itemCount > 1 ? 's' : ''} en promotion`;
      case "specialOffer":
        if (basket.specialOffer?.type === "buyOneGetOne") {
          return "Achetez 1, Obtenez 1 Gratuit";
        } else if (basket.specialOffer?.type === "multiplicationPoints") {
          return `Multipliez vos points x${basket.specialOffer.multiplier}`;
        }
        return "Offre spéciale disponible";
      case "customOffer":
        return basket.customOffer?.description || "Offre personnalisée";
      case "seasonal_liquidation":
        return "Liquidation saisonnière";
      default:
        return "Offre disponible";
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/games/start", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setGameState({ question: data.question, score: 0 });
        setShowGameModal(true);
      } else {
        alert("Erreur lors du chargement du jeu.");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      alert("Impossible de démarrer le jeu.");
    }
  };

  const submitAnswer = async (answer) => {
    try {
      const response = await fetch("http://localhost:5000/api/games/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ questionId: gameState.question._id, answer }),
      });
      const data = await response.json();
      if (response.ok) {
        setGameState(prev => ({
          ...prev,
          score: prev.score + (data.correct ? 10 : 0),
          question: data.newQuestion || null,
        }));
        if (!data.newQuestion) {
          alert(`Jeu terminé ! Score : ${gameState.score + (data.correct ? 10 : 0)} points.`);
          setShowGameModal(false);
        }
      } else {
        alert("Réponse incorrecte ou erreur.");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la soumission.");
    }
  };

  const startMemoryGame = () => {
    setMemoryIsPlaying(true);
    setGameState({ ...gameState, score: 0 });
    setShowMemoryModal(true);
    startNewMemoryRound();
  };

  const startNewMemoryRound = () => {
    const newSequence = Array.from({ length: Math.min(memorySequence.length + 1, 10) }, () =>
      Math.floor(Math.random() * 9)
    );
    setMemorySequence(newSequence);
    setMemoryUserInput([]);
    showMemorySequence(newSequence);
  };

  const showMemorySequence = async (seq) => {
    for (let i of seq) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMemoryActiveTile(i);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMemoryActiveTile(null);
    }
    setMemoryIsPlaying(false);
  };

  const handleMemoryTileClick = (index) => {
    if (!memoryIsPlaying || memoryUserInput.length >= memorySequence.length) return;
    setMemoryUserInput([...memoryUserInput, index]);
    setMemoryActiveTile(index);
    setTimeout(() => setMemoryActiveTile(null), 300);

    if (memoryUserInput.length + 1 === memorySequence.length) {
      checkMemorySequence();
    }
  };

  const checkMemorySequence = () => {
    const isCorrect = memoryUserInput.every((val, i) => val === memorySequence[i]);
    if (isCorrect) {
      const newScore = gameState.score + 10;
      setGameState({ ...gameState, score: newScore });
      if (memorySequence.length < 10) {
        setTimeout(startNewMemoryRound, 500);
      } else {
        alert(`Félicitations ! Score final : ${newScore} pièces d'or !`);
        setShowMemoryModal(false);
      }
    } else {
      alert("Mauvaise séquence ! Le trésor reste caché. Essaye encore !");
      setShowMemoryModal(false);
    }
  };

  const startPuzzleGame = () => {
    const size = LEVELS[puzzleState.level].size;
    const { grid, emptyPos } = shufflePuzzle(size);
    setPuzzleState({
      level: puzzleState.level,
      grid,
      emptyPos,
      moves: 0,
      timer: 0,
      isPlaying: true,
      isComplete: false,
      score: 0
    });
    setShowPuzzleModal(true);
  };

  const LEVELS = {
    beginner: { size: 3, basePoints: 15, target: { time: 120, moves: 30 }, loyaltyPoints: 10 },
    intermediate: { size: 4, basePoints: 35, target: { time: 120, moves: 45 }, loyaltyPoints: 20 },
    expert: { size: 5, basePoints: 60, target: { time: 120, moves: 60 }, loyaltyPoints: 30 }
  };

  const generateTreasureMap = (size) => {
    const colors = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460'];
    const symbols = ['🏴‍☠️', '⚓', '💎', '🗝️', '💰', '🏝️', '⭐', '🌴'];
    
    const map = [];
    for (let i = 0; i < size * size - 1; i++) {
      const colorIndex = Math.floor(i / (size * size / colors.length));
      const symbolIndex = i % symbols.length;
      map.push({
        id: i + 1,
        color: colors[colorIndex % colors.length],
        symbol: symbols[symbolIndex],
        correctPos: i
      });
    }
    return map;
  };

  const shufflePuzzle = useCallback((size) => {
    const pieces = generateTreasureMap(size);
    const grid = Array(size).fill().map(() => Array(size).fill(null));
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    
    let pieceIndex = 0;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (row === size - 1 && col === size - 1) {
          continue;
        }
        grid[row][col] = shuffled[pieceIndex++];
      }
    }
    
    return {
      grid,
      emptyPos: { row: size - 1, col: size - 1 }
    };
  }, []);

  const checkComplete = useCallback((grid) => {
    const size = grid.length;
    let correctCount = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const piece = grid[row][col];
        if (piece && piece.correctPos === row * size + col) {
          correctCount++;
        }
      }
    }
    
    return correctCount === size * size - 1;
  }, []);

  const movePiece = (row, col) => {
    if (!puzzleState.isPlaying || puzzleState.isComplete) return;

    const { grid, emptyPos } = puzzleState;
    const size = grid.length;
    
    const isAdjacent = 
      (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
      (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row);
    
    if (!isAdjacent) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[emptyPos.row][emptyPos.col] = newGrid[row][col];
    newGrid[row][col] = null;

    const newMoves = puzzleState.moves + 1;
    const isComplete = checkComplete(newGrid);

    if (isComplete) {
      const level = LEVELS[puzzleState.level];
      let score = level.basePoints;
      
      if (puzzleState.timer < level.target.time) {
        score = Math.floor(score * 1.5);
      }
      
      if (newMoves < level.target.moves) {
        score = Math.floor(score * 1.25);
      }

      setPlayerStats(prev => {
        const newStats = { ...prev };
        if (puzzleState.level === 'beginner') newStats.beginnerWins++;
        if (puzzleState.level === 'intermediate') newStats.intermediateWins++;
        if (puzzleState.level === 'expert') newStats.expertWins++;
        newStats.totalScore += score;
        return newStats;
      });

      // Ajouter les points de fidélité
      addLoyaltyPoints(level.loyaltyPoints);

      setPuzzleState(prev => ({
        ...prev,
        grid: newGrid,
        emptyPos: { row, col },
        moves: newMoves,
        isComplete: true,
        isPlaying: false,
        score
      }));
    } else {
      setPuzzleState(prev => ({
        ...prev,
        grid: newGrid,
        emptyPos: { row, col },
        moves: newMoves
      }));
    }
  };

 const addLoyaltyPoints = async (points) => {
  try {
    const token = localStorage.getItem("token");
    console.log("Tentative d'ajout de points. Token:", token?.substring(0, 10) + "...", "Points:", points, "Level:", puzzleState.level);
    if (!token) throw new Error("Aucun token trouvé.");

    const response = await fetch("http://localhost:5000/api/auth/addLoyaltyPointsFromPuzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ points, level: puzzleState.level }),
    });

    const data = await response.json();
    console.log("Réponse de l'API:", { status: response.status, data });

    if (response.ok) {
      alert(`Félicitations ! Vous avez gagné ${points} points de fidélité !`);
    } else {
      throw new Error(data.message || "Erreur lors de l'ajout des points de fidélité.");
    }
  } catch (err) {
    console.error("Erreur lors de l'ajout des points:", err.message, err.stack);
    alert("Erreur lors de l'ajout des points de fidélité: " + err.message);
  }
};

  useEffect(() => {
    let interval;
    if (puzzleState.isPlaying && !puzzleState.isComplete) {
      interval = setInterval(() => {
        setPuzzleState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [puzzleState.isPlaying, puzzleState.isComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canUnlockLevel = (level) => {
    if (level === 'beginner') return true;
    if (level === 'intermediate') return playerStats.beginnerWins >= 5;
    if (level === 'expert') return playerStats.intermediateWins >= 5;
    return false;
  };

  if (loading || !user) {
    return <p className="text-center text-xl mt-10">Chargement...</p>;
  }

  return (
    <>
      <Navbar />
      <div
        className="relative min-h-screen p-6"
        style={{
          backgroundImage: "url('/fond8.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundColor: "#F5E6D3",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/30 to-[#D2B48C]/50"></div>

        <div className="relative max-w-4xl mx-auto mb-8">
  <div className="bg-[#8B4513] p-8 rounded-2xl shadow-xl text-center border-4 border-[#FFD700] transform hover:scale-105 transition-transform duration-300" style={{ backgroundImage: 'url(/wooden-chest-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#FFD700] text-[#8B4513] px-4 py-1 rounded-full text-lg font-bold">
      🏴‍☠️ Bienvenue à Bord !
    </div>
    <h1 className="text-4xl font-bold text-[#FFD700] mb-4 drop-shadow-lg" style={{ textShadow: "2px 2px 4px #8B4513" }}>
      Ahoy, {user?.nom} ! 🏝️
    </h1>
    <p className="text-[#DAA520] text-lg drop-shadow-md">
      Partez à la découverte de nos trésors !
    </p>
    {welcomeMessage && (
      <p className="text-[#32CD32] mt-3 text-lg drop-shadow-md">
        {welcomeMessage}
      </p>
    )}
  </div>
</div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#FFD700] mb-2 drop-shadow-lg" style={{ textShadow: "2px 2px 4px #8B4513" }}>
              🗺️ Trésors Exclusifs pour Vous !
            </h2>
            <p className="text-[#DAA520] text-lg">
              Explorez nos coffres remplis d'offres
            </p>
          </div>

          {basketError && (
            <div className="bg-[#FF4500]/80 border border-[#8B0000] text-white px-4 py-3 rounded mb-6">
              {basketError}
            </div>
          )}

          {basketLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E90FF]"></div>
              <p className="text-[#DAA520] mt-4">Recherche des trésors en cours...</p>
            </div>
          ) : seasonalBaskets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💎</div>
              <p className="text-[#DAA520] text-lg">
                Aucun trésor disponible pour l'instant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasonalBaskets.map((basket) => {
                const cardStyles = {
                  promotion: { 
                    bg: "from-[#ADD8E6]/70 to-[#87CEEB]/70", 
                    border: "border-[#1E90FF]",
                    accent: "bg-[#1E90FF]"
                  },
                  specialOffer: { 
                    bg: "from-[#98FB98]/70 to-[#90EE90]/70", 
                    border: "border-[#32CD32]",
                    accent: "bg-[#32CD32]"
                  },
                  customOffer: { 
                    bg: "from-[#FFD700]/70 to-[#FFA500]/70", 
                    border: "border-[#DAA520]",
                    accent: "bg-[#DAA520]"
                  },
                  seasonal_liquidation: { 
                    bg: "from-[#FF6347]/70 to-[#FF4500]/70", 
                    border: "border-[#8B0000]",
                    accent: "bg-[#8B0000]"
                  },
                }[basket.type] || { 
                  bg: "from-[#D3D3D3]/70 to-[#C0C0C0]/70", 
                  border: "border-[#808080]",
                  accent: "bg-[#808080]"
                };

                return (
                  <div
                    key={basket._id || Math.random().toString(36).substr(2, 9)}
                    className={`relative bg-gradient-to-br ${cardStyles.bg} p-6 rounded-2xl shadow-xl border-4 ${cardStyles.border} cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
                    onClick={() => openOfferModal(basket)}
                  >
                    <div className={`absolute -top-5 -right-5 w-14 h-14 ${cardStyles.accent} rounded-full flex items-center justify-center shadow-lg border-4 border-[#8B4513]`}>
                      <span className="text-3xl text-[#FFD700]">{getOfferEmoji(basket)}</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#FFD700] mb-2 drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                          {getOfferTitle(basket)}
                        </h3>
                        <p className="text-sm text-[#DAA520] font-medium">
                          chez {shopNames[merchantIdToShopId[basket.merchantId]] || basket.merchantId}
                        </p>
                      </div>

                      <div className="bg-[#F5F5DC]/70 p-3 rounded-lg border border-[#8B4513]">
                        <p className="text-sm text-[#8B4513]">
                          {getOfferSummary(basket)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#FF4500] font-semibold">
                          Expire le {new Date(basket.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-[#1E90FF] font-medium text-sm">
                          Voir le trésor →
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-[#8B4513]">
              <div className="sticky top-0 bg-[#F4A460] border-b-4 border-[#8B4513] p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl text-[#FFD700]">{getOfferEmoji(selectedOffer)}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-[#FFD700] drop-shadow-lg" style={{ textShadow: "2px 2px 4px #8B4513" }}>
                        {getOfferTitle(selectedOffer)}
                      </h2>
                      <p className="text-[#DAA520]">
                        chez {shopNames[merchantIdToShopId[selectedOffer.merchantId]] || selectedOffer.merchantId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeOfferModal}
                    className="text-[#FFD700] hover:text-[#DAA520] text-3xl font-bold drop-shadow-md"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-4 text-sm text-[#FF4500] font-semibold">
                  ⏰ Valable jusqu'au {new Date(selectedOffer.endDate).toLocaleDateString()}
                </div>
              </div>

              <div className="p-6">
                {selectedOffer.type === "promotion" && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#FFD700] mb-4 drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                      🏷️ Trésors en Promotion
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedOffer.items || selectedOffer.productIds || []).map((item, index) => {
                        const product = item?.productId || item?.product || item;
                        const productName = product?.name || `Produit ${index + 1}`;
                        const discount = item?.discount || selectedOffer.discountValue || 0;
                        const originalPrice = product?.price || 0;
                        const discountedPrice = originalPrice * (1 - discount / 100);

                        return (
                          <div
                            key={item?._id || `item-${index}`}
                            className="bg-[#F5F5DC] border-2 border-[#8B4513] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => openModal({
                              ...item,
                              product: product,
                              discount: discount,
                              originalPrice: originalPrice,
                              discountedPrice: discountedPrice
                            })}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-[#8B4513]">{productName}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-lg font-bold text-[#FFD700]">
                                    {discountedPrice.toFixed(2)}€
                                  </span>
                                  <span className="text-sm text-[#DAA520] line-through">
                                    {originalPrice.toFixed(2)}€
                                  </span>
                                </div>
                                {product?.stock && (
                                  <p className="text-xs text-[#8B4513] mt-1">
                                    {product.stock} disponible(s)
                                  </p>
                                )}
                              </div>
                              <div className="bg-[#FF4500] text-[#FFD700] px-3 py-1 rounded-full text-sm font-bold">
                                -{discount}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedOffer.type === "specialOffer" && selectedOffer.specialOffer && (
                  <div className="space-y-6">
                    {selectedOffer.specialOffer.type === "buyOneGetOne" && (
                      <div className="bg-gradient-to-r from-[#98FB98]/70 to-[#90EE90]/70 p-6 rounded-xl border-2 border-[#32CD32]">
                        <h3 className="text-xl font-semibold text-[#FFD700] mb-4 drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                          🎁 Trésor : Achetez 1, Obtenez 1 Gratuit
                        </h3>
                        {selectedOffer.specialOffer.buyProduct && selectedOffer.specialOffer.getProduct && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#F5F5DC] p-4 rounded-lg shadow-sm border-2 border-[#8B4513]">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-[#32CD32] font-bold">🛒 À acheter</span>
                              </div>
                              <h4 className="font-medium text-[#8B4513]">{selectedOffer.specialOffer.buyProduct.name}</h4>
                              <p className="text-lg font-bold text-[#FFD700]">
                                {selectedOffer.specialOffer.buyProduct.price}€
                              </p>
                              {selectedOffer.specialOffer.buyProduct.imageUrl && (
                                <div className="mt-3">
                                  <Image
                                    src={selectedOffer.specialOffer.buyProduct.imageUrl}
                                    alt={selectedOffer.specialOffer.buyProduct.name}
                                    width={100}
                                    height={100}
                                    className="rounded object-cover"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="bg-[#F5F5DC] p-4 rounded-lg shadow-sm border-2 border-[#8B4513]">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-[#FF4500] font-bold">🎁 Gratuit</span>
                              </div>
                              <h4 className="font-medium text-[#8B4513]">{selectedOffer.specialOffer.getProduct.name}</h4>
                              <p className="text-lg font-bold text-[#32CD32]">
                                Gratuit ! (valeur {selectedOffer.specialOffer.getProduct.price}€)
                              </p>
                              {selectedOffer.specialOffer.getProduct.imageUrl && (
                                <div className="mt-3">
                                  <Image
                                    src={selectedOffer.specialOffer.getProduct.imageUrl}
                                    alt={selectedOffer.specialOffer.getProduct.name}
                                    width={100}
                                    height={100}
                                    className="rounded object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-6 text-center">
                          <div className="bg-[#FFD700]/80 p-3 rounded-lg inline-block border-2 border-[#8B4513]">
                            <p className="font-bold text-[#8B4513]">
                              💰 Économisez {selectedOffer.specialOffer.getProduct?.price || 0}€ !
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOffer.specialOffer.type === "multiplicationPoints" && (
                      <div className="bg-gradient-to-r from-[#9370DB]/70 to-[#BA55D3]/70 p-6 rounded-xl text-center border-2 border-[#8B4513]">
                        <h3 className="text-xl font-semibold text-[#FFD700] mb-4 drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                          ⭐ Multiplicateur de Pièces d'Or
                        </h3>
                        <div className="bg-[#F5F5DC] p-6 rounded-lg shadow-sm border-2 border-[#8B4513]">
                          <div className="text-6xl font-bold text-[#FFD700] mb-2 drop-shadow-lg" style={{ textShadow: "2px 2px 4px #8B4513" }}>
                            x{selectedOffer.specialOffer.multiplier}
                          </div>
                          <p className="text-lg text-[#8B4513] mb-4">
                            Multipliez vos pièces par {selectedOffer.specialOffer.multiplier} !
                          </p>
                          {selectedOffer.specialOffer.minPoints > 0 && (
                            <p className="text-sm text-[#DAA520]">
                              Pièces minimum requises : {selectedOffer.specialOffer.minPoints}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <button
                        onClick={() => claimSpecialOffer(selectedOffer._id)}
                        className="bg-gradient-to-r from-[#FFD700] to-[#DAA520] text-[#8B4513] font-bold px-8 py-3 rounded-lg hover:from-[#FFC107] hover:to-[#FF8C00] transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-[#8B4513]"
                      >
                        🎁 Réclamer ce Trésor
                      </button>
                    </div>
                  </div>
                )}

                {selectedOffer.type === "customOffer" && (
                  <div className="bg-gradient-to-r from-[#FFD700]/70 to-[#FFA500]/70 p-6 rounded-xl border-2 border-[#8B4513]">
                    <h3 className="text-xl font-semibold text-[#FFD700] mb-4 drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                      ✨ {selectedOffer.customOffer?.title || "Trésor Personnalisé"}
                    </h3>
                    <div className="bg-[#F5F5DC] p-4 rounded-lg shadow-sm border-2 border-[#8B4513]">
                      <p className="text-[#8B4513] mb-4">
                        {selectedOffer.customOffer?.description || "Aucune description disponible"}
                      </p>
                      {selectedOffer.customOffer?.terms && (
                        <div className="border-t pt-4 border-[#8B4513]">
                          <p className="text-sm text-[#DAA520]">
                            <strong>Conditions :</strong> {selectedOffer.customOffer.terms}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-md w-full border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#FFD700] drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>Détails du Trésor</h3>
                <button
                  onClick={closeModal}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {(selectedItem?.product?.imageUrl || selectedItem?.productId?.imageUrl) && (
                  <div className="text-center mb-4">
                    <Image
                      src={selectedItem.product?.imageUrl || selectedItem.productId?.imageUrl}
                      alt={selectedItem.product?.name || selectedItem.productId?.name || "Trésor"}
                      width={200}
                      height={200}
                      className="object-cover rounded-lg mx-auto border-2 border-[#8B4513]"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-[#8B4513]">Nom :</span>
                    <p className="text-[#DAA520]">{selectedItem?.product?.name || selectedItem?.productId?.name || "Trésor inconnu"}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-[#8B4513]">Catégorie :</span>
                    <p className="text-[#DAA520]">{
                      selectedItem?.product?.category || 
                      selectedItem?.productId?.category || 
                      selectedItem?.category || 
                      "Non spécifiée"
                    }</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-[#8B4513]">Stock disponible :</span>
                    <p className="text-[#DAA520]">{
                      selectedItem?.product?.stock || 
                      selectedItem?.productId?.stock || 
                      selectedItem?.quantity || 
                      selectedItem?.stock || 
                      "Non spécifié"
                    }</p>
                  </div>
                  
                  {selectedItem?.discount && (
                    <>
                      <div>
                        <span className="font-semibold text-[#8B4513]">Prix original :</span>
                        <p className="text-[#DAA520] line-through">{selectedItem?.originalPrice || "N/A"} €</p>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-[#8B4513]">Réduction :</span>
                        <p className="text-[#FF4500] font-semibold">{selectedItem?.discount || 0}%</p>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-[#8B4513]">Prix réduit :</span>
                        <p className="text-[#FFD700] font-bold text-lg">
                          {selectedItem?.discountedPrice?.toFixed(2) || "N/A"} €
                        </p>
                      </div>
                    </>
                  )}
                </div>
              
                <button
                  onClick={closeModal}
                  className="mt-6 w-full bg-[#1E90FF] text-[#FFD700] p-3 rounded-lg hover:bg-[#00B7EB] transition-colors border-2 border-[#8B4513]"
                >
                  Fermer le Coffre
                </button>
              </div>
            </div>
          </div>
        )}

        {showGameModal && gameState.question && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-md w-full border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#FFD700] drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                  🗺️ Devine le Trésor
                </h3>
                <button
                  onClick={() => setShowGameModal(false)}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-[#8B4513] text-lg">Score : {gameState.score} pièces d'or</p>
                {gameState.question.hints.map((hint, index) => (
                  <p key={index} className="text-[#DAA520] italic">{hint}</p>
                ))}
                {gameState.question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => submitAnswer(option)}
                    className="w-full bg-[#FFD700] text-[#8B4513] px-4 py-2 rounded-lg hover:bg-[#FFC107] mt-2 border-2 border-[#8B4513]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showMemoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-md w-full border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#FFD700] drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                  Mémoire du Trésor
                </h3>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-[#8B4513] text-lg">Score : {gameState.score} pièces d'or</p>
                {!memoryIsPlaying ? (
                  <button
                    onClick={startMemoryGame}
                    className="w-full bg-[#FFD700] text-[#8B4513] px-4 py-2 rounded-lg hover:bg-[#FFC107] border-2 border-[#8B4513]"
                  >
                    Commencer la Chasse
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }, (_, i) => (
                      <div
                        key={i}
                        className={`tile bg-[#FFD700] w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer border-2 border-[#8B4513] hover:bg-[#FFC107] transition-colors ${memoryActiveTile === i ? "active" : ""}`}
                        onClick={() => handleMemoryTileClick(i)}
                      >
                        {["💰", "🏺", "👑", "📦", "🔮", "⚔️", "🔔", "🌟", "🛡️"][i]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPuzzleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#FFD700] drop-shadow-lg" style={{ textShadow: "1px 1px 3px #8B4513" }}>
                  🗺️ Treasure Map Puzzle
                </h3>
                <button
                  onClick={() => setShowPuzzleModal(false)}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-center gap-4 mb-6">
                  {Object.entries(LEVELS).map(([level, config]) => (
                    <button
                      key={level}
                      onClick={() => {
                        setPuzzleState(prev => ({ ...prev, level }));
                        startPuzzleGame();
                      }}
                      disabled={!canUnlockLevel(level)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        puzzleState.level === level
                          ? 'bg-amber-600 text-white'
                          : canUnlockLevel(level)
                          ? 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {level === 'beginner' && '🟢 Débutant'}
                      {level === 'intermediate' && '🟡 Intermédiaire'}
                      {level === 'expert' && '🔴 Expert'}
                      <div className="text-xs">
                        {config.size}x{config.size} - {config.basePoints}pts
                      </div>
                      {!canUnlockLevel(level) && (
                        <div className="text-xs">🔒 Verrouillé</div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-6 mb-6">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-mono">{formatTime(puzzleState.timer)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <Target className="w-5 h-5 text-green-600" />
                    <span>{puzzleState.moves} mouvements</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span>{playerStats.totalScore} points</span>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div 
                    className="grid gap-2 p-4 bg-amber-900 rounded-xl shadow-2xl"
                    style={{ 
                      gridTemplateColumns: `repeat(${LEVELS[puzzleState.level].size}, 1fr)`,
                      width: 'fit-content'
                    }}
                  >
                    {puzzleState.grid.map((row, rowIndex) =>
                      row.map((piece, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => movePiece(rowIndex, colIndex)}
                          className={`
                            w-16 h-16 rounded-lg border-2 border-amber-700 flex items-center justify-center
                            text-2xl font-bold cursor-pointer transition-all duration-200
                            ${piece 
                              ? 'shadow-lg hover:scale-105 active:scale-95' 
                              : 'bg-amber-800 shadow-inner'
                            }
                          `}
                          style={{ 
                            backgroundColor: piece ? piece.color : 'transparent',
                            color: piece ? '#FFF' : 'transparent'
                          }}
                        >
                          {piece && (
                            <div className="text-center">
                              <div>{piece.symbol}</div>
                              <div className="text-xs">{piece.id}</div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={startPuzzleGame}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Shuffle className="w-4 h-4" />
                    Nouveau Puzzle
                  </button>
                  <button
                    onClick={() => {
                      setPuzzleState(prev => ({ ...prev, ...shufflePuzzle(LEVELS[prev.level].size), moves: 0, timer: 0 }));
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recommencer
                  </button>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Statistiques du Joueur
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{playerStats.beginnerWins}</div>
                      <div className="text-sm text-gray-600">Victoires Débutant</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{playerStats.intermediateWins}</div>
                      <div className="text-sm text-gray-600">Victoires Intermédiaire</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{playerStats.expertWins}</div>
                      <div className="text-sm text-gray-600">Victoires Expert</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{playerStats.totalScore}</div>
                      <div className="text-sm text-gray-600">Score Total</div>
                    </div>
                  </div>
                </div>

                {puzzleState.isComplete && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-amber-800 mb-4">Puzzle Résolu !</h2>
                        <div className="space-y-2 mb-6">
                          <div className="text-lg">Score: <span className="font-bold text-amber-600">{puzzleState.score} points</span></div>
                          <div>Temps: {formatTime(puzzleState.timer)}</div>
                          <div>Mouvements: {puzzleState.moves}</div>
                          {puzzleState.timer < LEVELS[puzzleState.level].target.time && (
                            <div className="text-green-600 font-semibold">🚀 Bonus Temps (+50%)</div>
                          )}
                          {puzzleState.moves < LEVELS[puzzleState.level].target.moves && (
                            <div className="text-blue-600 font-semibold">🎯 Bonus Mouvements (+25%)</div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowPuzzleModal(false)}
                          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Continuer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}