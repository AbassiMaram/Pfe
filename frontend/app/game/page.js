"use client";

import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Trophy, Clock, Target, Star, Shuffle, RotateCcw, Pickaxe, MapPin, Coins } from "lucide-react";

export default function Games() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [gameState, setGameState] = useState({ question: null, score: 0 });
  const [showGameModal, setShowGameModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memorySequence, setMemorySequence] = useState([]);
  const [memoryUserInput, setMemoryUserInput] = useState([]);
  const [memoryIsPlaying, setMemoryIsPlaying] = useState(false);
  const [memoryActiveTile, setMemoryActiveTile] = useState(null);
  const [memoryCanPlay, setMemoryCanPlay] = useState(false);
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
  const [showTreasureDig, setShowTreasureDig] = useState(false);
  const canvasRef = useRef(null);
  const [treasureDigState, setTreasureDigState] = useState({
    shovelsLeft: 5,
    score: 0,
    foundTreasures: [],
    gameOver: false,
    isDigging: false
  });
  const [treasurePlayerStats, setTreasurePlayerStats] = useState({
    totalScore: 0,
    treasuresFound: {
      coins: 0,
      gems: 0,
      crowns: 0,
      chests: 0
    }
  });
  const [showTreasureResults, setShowTreasureResults] = useState(false);
  const [showTreasureHunterMemoryModal, setShowTreasureHunterMemoryModal] = useState(false);
  const [treasureHunterMemoryState, setTreasureHunterMemoryState] = useState({
    level: 1,
    score: 0,
    lives: 3,
    isPlaying: false,
    gameOver: false,
    gameWon: false
  });
  const [treasureHunterMemoryCards, setTreasureHunterMemoryCards] = useState([]);
  const [treasureHunterMemoryFlippedCards, setTreasureHunterMemoryFlippedCards] = useState([]);
  const [treasureHunterMemoryMatchedCards, setTreasureHunterMemoryMatchedCards] = useState([]);
  const [treasureHunterMemoryIsChecking, setTreasureHunterMemoryIsChecking] = useState(false);
  const [treasureHunterMemoryShowingAll, setTreasureHunterMemoryShowingAll] = useState(false);

  const TREASURES = {
    coin: { emoji: '🪙', points: 5, rarity: 0.4, size: 25, name: 'Pièce d\'or' },
    gem: { emoji: '💎', points: 15, rarity: 0.25, size: 20, name: 'Gemme' },
    crown: { emoji: '👑', points: 50, rarity: 0.08, size: 30, name: 'Couronne' },
    chest: { emoji: '⚱️', points: 100, rarity: 0.02, size: 35, name: 'Coffre légendaire' }
  };

  const ISLAND_ELEMENTS = {
    palm: { emoji: '🌴', hint: 'treasure_nearby' },
    rock: { emoji: '🪨', hint: 'high_treasure_chance' },
    wave: { emoji: '🌊', hint: 'no_treasure' },
    crab: { emoji: '🦀', hint: 'neutral' }
  };

  const PIRATE_ITEMS = {
    sword: { emoji: '⚔️', name: 'Épée' },
    pearl: { emoji: '🦪', name: 'Perle' },
    anchor: { emoji: '⚓', name: 'Ancre' },
    chest: { emoji: '💰', name: 'Coffre' },
    skull: { emoji: '💀', name: 'Crâne' },
    parrot: { emoji: '🦜', name: 'Perroquet' },
    ship: { emoji: '⛵', name: 'Navire' },
    compass: { emoji: '🧭', name: 'Boussole' },
    rum: { emoji: '🍺', name: 'Rhum' },
    map: { emoji: '🗺️', name: 'Carte' },
    cannon: { emoji: '💣', name: 'Canon' },
    hook: { emoji: '🪝', name: 'Crochet' }
  };

  const [islandData, setIslandData] = useState({
    treasures: [],
    elements: [],
    revealedAreas: new Set()
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [loading, user, router]);

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
    setMemoryCanPlay(false);
    for (let i of seq) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMemoryActiveTile(i);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMemoryActiveTile(null);
    }
    setMemoryIsPlaying(false);
    setMemoryCanPlay(true);
  };

  const handleMemoryTileClick = (index) => {
    if (!memoryCanPlay || memoryUserInput.length >= memorySequence.length) return;
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

  const addLoyaltyPoints = async (points, source = "puzzle") => {
    try {
      const token = localStorage.getItem("token");
      console.log("Tentative d'ajout de points. Token:", token?.substring(0, 10) + "...", "Points:", points, "Source:", source);
      if (!token) throw new Error("Aucun token trouvé.");

      let url, body;
      if (source === "puzzle") {
        url = "http://localhost:5000/api/auth/addLoyaltyPointsFromPuzzle";
        body = JSON.stringify({ points, level: puzzleState.level });
      } else if (source === "treasureDig") {
        url = "http://localhost:5000/api/auth/addLoyaltyPointsFromTreasureDig";
        body = JSON.stringify({ points });
      } else if (source === "treasureHunterMemory") {
        url = "http://localhost:5000/api/auth/addLoyaltyPointsFromTreasureHunterMemory";
        body = JSON.stringify({ points });
      } else {
        throw new Error("Source non reconnue.");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await response.json();
      console.log("Réponse de l'API:", { status: response.status, data });

      if (response.ok) {
        const message = source === "puzzle"
          ? `Félicitations ! Vous avez gagné ${points} points de fidélité en complétant le niveau ${puzzleState.level} du puzzle !`
          : source === "treasureDig"
          ? `Félicitations ! Vous avez gagné ${points} points de fidélité en jouant à Treasure Dig !`
          : `Félicitations ! Vous avez gagné ${points} points de fidélité en jouant à Treasure Hunter Memory !`;
        alert(message);
      } else {
        throw new Error(data.message || "Erreur lors de l'ajout des points de fidélité.");
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout des points:", err.message, err.stack);
      //alert("Erreur lors de l'ajout des points de fidélité: " + err.message);
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

  const generateIsland = useCallback(() => {
    const treasures = [];
    const elements = [];
    const width = 400;
    const height = 300;

    Object.entries(TREASURES).forEach(([type, config]) => {
      const count = Math.floor(Math.random() * 3) + (config.rarity > 0.3 ? 2 : 1);
      for (let i = 0; i < count; i++) {
        if (Math.random() < config.rarity) {
          treasures.push({
            id: `${type}_${i}`,
            type,
            x: Math.random() * (width - config.size),
            y: Math.random() * (height - config.size),
            size: config.size,
            found: false
          });
        }
      }
    });

    const elementTypes = Object.keys(ISLAND_ELEMENTS);
    for (let i = 0; i < 8; i++) {
      const elementType = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      const element = {
        id: `element_${i}`,
        type: elementType,
        x: Math.random() * (width - 30),
        y: Math.random() * (height - 30),
        size: 25
      };

      if (ISLAND_ELEMENTS[elementType].hint === 'treasure_nearby' && treasures.length > 0) {
        const nearbyTreasure = treasures[Math.floor(Math.random() * treasures.length)];
        element.x = nearbyTreasure.x + (Math.random() - 0.5) * 60;
        element.y = nearbyTreasure.y + (Math.random() - 0.5) * 60;
      }

      elements.push(element);
    }

    return { treasures, elements, revealedAreas: new Set() };
  }, []);

  const initTreasureDig = useCallback(() => {
    const newIslandData = generateIsland();
    setIslandData(newIslandData);
    setTreasureDigState({
      shovelsLeft: 5,
      score: 0,
      foundTreasures: [],
      gameOver: false,
      isDigging: false
    });
    setShowTreasureResults(false);
  }, [generateIsland]);

  const canDig = () => {
    const now = Date.now();
    if (treasurePlayerStats.dailyDigs >= 3) {
      if (!treasurePlayerStats.lastDigTime || now - treasurePlayerStats.lastDigTime > 24 * 60 * 60 * 1000) {
        return true;
      }
      return false;
    }
    if (treasurePlayerStats.nextDigTime && now < treasurePlayerStats.nextDigTime) {
      return false;
    }
    return true;
  };

  const drawIsland = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
    oceanGradient.addColorStop(0, '#87CEEB');
    oceanGradient.addColorStop(1, '#4682B4');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, width, height);

    const sandGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.min(width, height)/2);
    sandGradient.addColorStop(0, '#F4A460');
    sandGradient.addColorStop(0.7, '#DEB887');
    sandGradient.addColorStop(1, '#D2691E');
    ctx.fillStyle = sandGradient;
    ctx.beginPath();
    ctx.ellipse(width/2, height/2, width/2 - 20, height/2 - 20, 0, 0, 2 * Math.PI);
    ctx.fill();

    islandData.elements.forEach(element => {
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        ISLAND_ELEMENTS[element.type].emoji, 
        element.x + element.size/2, 
        element.y + element.size/2 + 5
      );
    });

    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    islandData.revealedAreas.forEach(area => {
      const [x, y] = area.split(',').map(Number);
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
    });

    islandData.treasures.forEach(treasure => {
      if (treasure.found) {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          TREASURES[treasure.type].emoji, 
          treasure.x + treasure.size/2, 
          treasure.y + treasure.size/2 + 5
        );
      }
    });

    ctx.fillStyle = 'rgba(244, 164, 96, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalCompositeOperation = 'destination-out';
    islandData.revealedAreas.forEach(area => {
      const [x, y] = area.split(',').map(Number);
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [islandData]);

  const handleDig = (event) => {
    if (!canDig() || treasureDigState.shovelsLeft <= 0 || treasureDigState.gameOver) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const areaKey = `${Math.floor(x)},${Math.floor(y)}`;
    const newRevealedAreas = new Set([...islandData.revealedAreas, areaKey]);

    const foundTreasure = islandData.treasures.find(treasure => 
      !treasure.found &&
      x >= treasure.x && x <= treasure.x + treasure.size &&
      y >= treasure.y && y <= treasure.y + treasure.size
    );

    let newScore = treasureDigState.score;
    let newFoundTreasures = [...treasureDigState.foundTreasures];
    let newTreasuresStats = { ...treasurePlayerStats.treasuresFound };

    if (foundTreasure) {
      foundTreasure.found = true;
      const treasureConfig = TREASURES[foundTreasure.type];
      newScore += treasureConfig.points;
      newFoundTreasures.push({
        ...foundTreasure,
        points: treasureConfig.points,
        name: treasureConfig.name
      });

      if (foundTreasure.type === 'coin') newTreasuresStats.coins++;
      else if (foundTreasure.type === 'gem') newTreasuresStats.gems++;
      else if (foundTreasure.type === 'crown') newTreasuresStats.crowns++;
      else if (foundTreasure.type === 'chest') newTreasuresStats.chests++;
    }

    const newShovelsLeft = treasureDigState.shovelsLeft - 1;
    const isGameOver = newShovelsLeft === 0;

    setTreasureDigState(prev => ({
      ...prev,
      shovelsLeft: newShovelsLeft,
      score: newScore,
      foundTreasures: newFoundTreasures,
      gameOver: isGameOver
    }));

    setIslandData(prev => ({
      ...prev,
      revealedAreas: newRevealedAreas
    }));

    if (isGameOver) {
      const loyaltyPoints = Math.floor(newScore / 10);
      addLoyaltyPoints(loyaltyPoints, "treasureDig");

      setTreasurePlayerStats(prev => ({
        ...prev,
        totalScore: prev.totalScore + newScore,
        treasuresFound: newTreasuresStats
      }));
      setShowTreasureResults(true);
    }
  };

  const generateTreasureHunterMemoryCards = useCallback((level) => {
    const pairsCount = Math.min(4 + level, 12); // 5 paires au niveau 1, max 12 paires
    const itemKeys = Object.keys(PIRATE_ITEMS);
    const selectedItems = itemKeys.slice(0, pairsCount);
    
    const cardPairs = selectedItems.flatMap((item, index) => [
      { id: index * 2, type: item, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, type: item, isFlipped: false, isMatched: false }
    ]);

    return cardPairs.sort(() => Math.random() - 0.5);
  }, []);

  const initTreasureHunterMemoryLevel = useCallback(() => {
    const newCards = generateTreasureHunterMemoryCards(treasureHunterMemoryState.level);
    setTreasureHunterMemoryCards(newCards);
    setTreasureHunterMemoryFlippedCards([]);
    setTreasureHunterMemoryMatchedCards([]);
    setTreasureHunterMemoryIsChecking(false);
    
    setTreasureHunterMemoryShowingAll(true);
    setTimeout(() => {
      setTreasureHunterMemoryShowingAll(false);
      setTreasureHunterMemoryState(prev => ({ ...prev, isPlaying: true }));
    }, 3000);
  }, [treasureHunterMemoryState.level, generateTreasureHunterMemoryCards]);

  const startTreasureHunterMemory = () => {
    setTreasureHunterMemoryState({
      level: 1,
      score: 0,
      lives: 3,
      isPlaying: false,
      gameOver: false,
      gameWon: false
    });
    setShowTreasureHunterMemoryModal(true);
  };

  const handleTreasureHunterMemoryCardClick = (cardId) => {
    if (!treasureHunterMemoryState.isPlaying || treasureHunterMemoryIsChecking || treasureHunterMemoryShowingAll) return;
    if (treasureHunterMemoryFlippedCards.includes(cardId) || treasureHunterMemoryMatchedCards.includes(cardId)) return;
    if (treasureHunterMemoryFlippedCards.length >= 2) return;

    const newFlippedCards = [...treasureHunterMemoryFlippedCards, cardId];
    setTreasureHunterMemoryFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setTreasureHunterMemoryIsChecking(true);
      setTimeout(() => checkTreasureHunterMemoryMatch(newFlippedCards), 1000);
    }
  };

  const checkTreasureHunterMemoryMatch = (flippedCardIds) => {
    const [firstCard, secondCard] = flippedCardIds.map(id => 
      treasureHunterMemoryCards.find(card => card.id === id)
    );

    if (firstCard.type === secondCard.type) {
      const newMatchedCards = [...treasureHunterMemoryMatchedCards, ...flippedCardIds];
      setTreasureHunterMemoryMatchedCards(newMatchedCards);
      setTreasureHunterMemoryState(prev => ({ 
        ...prev, 
        score: prev.score + (10 * prev.level) 
      }));

      if (newMatchedCards.length === treasureHunterMemoryCards.length) {
        setTimeout(() => completeTreasureHunterMemoryLevel(), 500);
      }
    } else {
      setTreasureHunterMemoryState(prev => ({ ...prev, lives: prev.lives - 1 }));

      if (treasureHunterMemoryState.lives <= 1) {
        setTimeout(() => {
          setTreasureHunterMemoryState(prev => ({ ...prev, gameOver: true, isPlaying: false }));
        }, 1000);
      }
    }

    setTreasureHunterMemoryFlippedCards([]);
    setTreasureHunterMemoryIsChecking(false);
  };

  const completeTreasureHunterMemoryLevel = () => {
    if (treasureHunterMemoryState.level >= 8) {
      setTreasureHunterMemoryState(prev => ({ 
        ...prev, 
        gameWon: true, 
        isPlaying: false,
        score: prev.score + 100 
      }));
      const loyaltyPoints = Math.floor(treasureHunterMemoryState.score / 10);
      addLoyaltyPoints(loyaltyPoints, "treasureHunterMemory");
    } else {
      setTreasureHunterMemoryState(prev => ({ 
        ...prev, 
        level: prev.level + 1,
        isPlaying: false
      }));
      setTimeout(() => initTreasureHunterMemoryLevel(), 2000);
    }
  };

  useEffect(() => {
    if (treasureHunterMemoryState.level === 1 && !treasureHunterMemoryState.gameOver && !treasureHunterMemoryState.gameWon) {
      initTreasureHunterMemoryLevel();
    }
  }, [treasureHunterMemoryState.level, treasureHunterMemoryState.gameOver, treasureHunterMemoryState.gameWon, initTreasureHunterMemoryLevel]);

  const getTreasureHunterMemoryGridCols = () => {
    const cardCount = treasureHunterMemoryCards.length;
    if (cardCount <= 10) return 5;
    if (cardCount <= 16) return 4;
    return 6;
  };

  const TreasureHunterMemoryCard = ({ card }) => {
    const isVisible = treasureHunterMemoryShowingAll || treasureHunterMemoryFlippedCards.includes(card.id) || treasureHunterMemoryMatchedCards.includes(card.id);
    
    return (
      <div
        className={`
          relative w-16 h-16 md:w-20 md:h-20 cursor-pointer transform transition-all duration-300
          ${isVisible ? 'rotate-0' : 'rotate-y-180'}
          ${treasureHunterMemoryMatchedCards.includes(card.id) ? 'opacity-75 scale-95' : 'hover:scale-105'}
        `}
        onClick={() => handleTreasureHunterMemoryCardClick(card.id)}
      >
        <div className={`
          absolute inset-0 rounded-lg border-2 flex items-center justify-center text-2xl md:text-3xl
          bg-gradient-to-br from-amber-600 to-amber-800 border-amber-900
          ${isVisible ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}>
          🏴‍☠️
        </div>
        
        <div className={`
          absolute inset-0 rounded-lg border-2 flex items-center justify-center text-2xl md:text-3xl
          bg-gradient-to-br from-blue-100 to-blue-200 border-blue-800
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300
          ${treasureHunterMemoryMatchedCards.includes(card.id) ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-800' : ''}
        `}>
          {PIRATE_ITEMS[card.type].emoji}
        </div>
      </div>
    );
  };

  useEffect(() => {
    drawIsland();
  }, [drawIsland]);

  useEffect(() => {
    initTreasureDig();
  }, [initTreasureDig]);

  if (loading || !user) {
    return <p className="text-center text-xl mt-10">Chargement...</p>;
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=Creepster&display=swap');
          
          :root {
            --pirate-gold: #FFD700;
            --pirate-brown: #8B4513;
            --pirate-sand: #F4A460;
            --pirate-wood: #D2691E;
            --pirate-red: #DC143C;
            --pirate-blue: #4682B4;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: ' Arial';
            background: linear-gradient(135deg, var(--pirate-blue) 0%, var(--pirate-sand) 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }

          .ocean-waves {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%234682B4" fill-opacity="0.3" d="m0,96l48,21.3c48,21,144,64,240,85.3c96,21,192,21,288,10.7c96-11,192-32,288-26.7c96,5,192,27,240,37.3l48,11v181.3H0V96z"></path></svg>') repeat-x;
            animation: wave 20s ease-in-out infinite;
            z-index: -1;
          }

          @keyframes wave {
            0%, 100% { transform: translateX(0px); }
            50% { transform: translateX(-50px); }
          }

          .quest-header {
            background: linear-gradient(135deg, var(--pirate-brown) 0%, var(--pirate-wood) 100%);
            padding: 20px;
            margin: 20px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 4px solid var(--pirate-gold);
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .quest-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--pirate-gold) 0%, transparent 70%);
            opacity: 0.1;
            animation: rotate 30s linear infinite;
          }

          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .quest-title {
            font-family: 'Creepster';
            font-size: 3rem;
            color: var(--pirate-gold);
            text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
          }

          .quest-subtitle {
            color: var(--pirate-sand);
            font-size: 1.2rem;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
          }

          .quest-progress {
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            padding: 10px;
            margin: 20px 0;
            position: relative;
            z-index: 2;
          }

          .progress-bar {
            background: linear-gradient(90deg, var(--pirate-gold) 0%, var(--pirate-red) 100%);
            height: 20px;
            border-radius: 10px;
            transition: width 1s ease;
            position: relative;
            overflow: hidden;
          }

          .progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .progress-text {
            color: white;
            text-align: center;
            margin-top: 5px;
            font-weight: bold;
          }

          .games-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .game-card {
            background: linear-gradient(135deg, var(--pirate-sand) 0%, var(--pirate-wood) 100%);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            border: 3px solid var(--pirate-brown);
            position: relative;
            overflow: hidden;
            transform: translateY(0);
            transition: all 0.4s ease;
            cursor: pointer;
          }

          .game-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          }

          .game-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="20">💎</text></svg>') repeat;
            opacity: 0.1;
            animation: float 15s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-10px, -10px) rotate(180deg); }
          }

          .game-icon {
            font-size: 4rem;
            text-align: center;
            margin-bottom: 15px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
            position: relative;
            z-index: 2;
          }

          .game-title {
            font-size: 1.8rem;
            color: var(--pirate-brown);
            text-align: center;
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            position: relative;
            z-index: 2;
          }

          .game-description {
            color: var(--pirate-brown);
            text-align: center;
            margin-bottom: 20px;
            line-height: 1.4;
            position: relative;
            z-index: 2;
          }

          .game-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
          }

          .stat {
            text-align: center;
            color: var(--pirate-brown);
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--pirate-gold);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }

          .play-button {
            width: 100%;
            background: linear-gradient(135deg, var(--pirate-gold) 0%, #FFA500 100%);
            color: var(--pirate-brown);
            border: none;
            padding: 15px 30px;
            border-radius: 15px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-family: ' Arial';
            position: relative;
            z-index: 2;
          }

          .play-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, #FFA500 0%, var(--pirate-gold) 100%);
          }

          .rewards-section {
            background: rgba(0,0,0,0.1);
            margin: 20px;
            padding: 20px;
            border-radius: 15px;
            border: 2px solid var(--pirate-gold);
          }

          .rewards-title {
            color: var(--pirate-gold);
            font-size: 1.5rem;
            text-align: center;
            margin-bottom: 15px;
          }

          .rewards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
          }

          .reward-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
          }

          .reward-icon {
            font-size: 2rem;
            margin-bottom: 10px;
          }

          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--pirate-gold);
            border-radius: 50%;
            pointer-events: none;
            animation: particle-float 3s linear infinite;
          }

          @keyframes particle-float {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) rotate(360deg);
              opacity: 0;
            }
          }

          @media (max-width: 768px) {
            .quest-title {
              font-size: 2rem;
            }
            
            .games-container {
              grid-template-columns: 1fr;
              padding: 10px;
            }
            
            .game-card {
              margin: 10px;
            }
          }
        `}
      </style>
      <div className="relative min-h-screen">
        <div className="ocean-waves"></div>
        <div id="particles"></div>
        <Navbar />
        <div className="relative max-w-4xl mx-auto p-6">
          

          <div className="games-container">
            <div className="game-card">
              <div className="game-icon">🗺️</div>
              <h3 className="game-title">Treasure Map Puzzle</h3>
              <p className="game-description">
                Reconstitue la carte au trésor pour révéler l'emplacement du butin !
              </p>
              <div className="game-stats">
                <div className="stat">
                  <div className="stat-value">⭐ {playerStats.beginnerWins}</div>
                  <div>Victoires</div>
                </div>
                <div className="stat">
                  <div className="stat-value">🏆 {playerStats.totalScore >= 500 ? 'Elite' : 'Débutant'}</div>
                  <div>Rang</div>
                </div>
                <div className="stat">
                  <div className="stat-value">💰 {playerStats.totalScore}</div>
                  <div>Pièces d'Or</div>
                </div>
              </div>
              <button className="play-button" onClick={startPuzzleGame}>
                ⚔️ Commencer l'Aventure !
              </button>
            </div>

            <div className="game-card">
              <div className="game-icon">⛏️</div>
              <h3 className="game-title">Treasure Dig</h3>
              <p className="game-description">
                Creuse l'île mystérieuse pour découvrir des trésors cachés sous le sable !
              </p>
              <div className="game-stats">
                <div className="stat">
                  <div className="stat-value">💎 {treasurePlayerStats.treasuresFound.gems}</div>
                  <div>Trésors</div>
                </div>
                <div className="stat">
                  <div className="stat-value">🏝️ 12</div>
                  <div>Îles Explorées</div>
                </div>
                <div className="stat">
                  <div className="stat-value">⛏️ {treasureDigState.shovelsLeft}</div>
                  <div>Pelles Restantes</div>
                </div>
              </div>
              <button className="play-button" onClick={() => setShowTreasureDig(true)}>
                🏴‍☠️ Explorer l'Île !
              </button>
            </div>

            <div className="game-card">
              <div className="game-icon">🧠</div>
              <h3 className="game-title">Treasure Hunter Memory</h3>
              <p className="game-description">
                Mémorise les objets pirates pour prouver que tu es un vrai chasseur de trésors !
              </p>
              <div className="game-stats">
                <div className="stat">
                  <div className="stat-value">🎯 {treasureHunterMemoryState.level}</div>
                  <div>Niveau</div>
                </div>
                <div className="stat">
                  <div className="stat-value">❤️ {treasureHunterMemoryState.lives}</div>
                  <div>Vies</div>
                </div>
                <div className="stat">
                  <div className="stat-value">🧩 {treasureHunterMemoryState.score}</div>
                  <div>Score</div>
                </div>
              </div>
              <button className="play-button" onClick={startTreasureHunterMemory}>
                🔍 Tester ma Mémoire !
              </button>
            </div>
          </div>

          
        </div>

        {showPuzzleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="quest-title">
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

        {showTreasureDig && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="quest-title">
                  ⛏️ Treasure Dig
                </h3>
                <button
                  onClick={() => setShowTreasureDig(false)}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-cyan-100 min-h-screen">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-blue-800 mb-2 flex items-center justify-center gap-2">
                    ⛵ Treasure Dig
                  </h1>
                  <p className="text-blue-700">Grattez le sable pour découvrir des trésors cachés sur l'île mystérieuse !</p>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <Pickaxe className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold">{treasureDigState.shovelsLeft} coups de pelle</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold">{treasureDigState.score} points</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">{treasureDigState.foundTreasures.length} trésors</span>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-2xl">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={300}
                      onClick={handleDig}
                      className={`border-2 border-blue-300 rounded-lg ${
                        canDig() && !treasureDigState.gameOver ? 'cursor-crosshair' : 'cursor-not-allowed opacity-50'
                      }`}
                      style={{ touchAction: 'none' }}
                    />
                    <div className="text-center mt-2 text-sm text-gray-600">
                      {canDig() && !treasureDigState.gameOver ? 'Cliquez pour creuser !' : 'Fouille terminée ou limitée'}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">🗺️ Indices Stratégiques</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🪨</div>
                      <div className="font-semibold text-gray-700">Zones rocheuses</div>
                      <div className="text-green-600">+ de trésors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌴</div>
                      <div className="font-semibold text-gray-700">Palmiers</div>
                      <div className="text-blue-600">Indices visuels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌊</div>
                      <div className="font-semibold text-gray-700">Vagues</div>
                      <div className="text-red-600">Zones vides</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🦀</div>
                      <div className="font-semibold text-gray-700">Crabes</div>
                      <div className="text-gray-600">Neutre</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">💰 Types de Trésors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(TREASURES).map(([type, config]) => (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-3xl mb-2">{config.emoji}</div>
                        <div className="font-semibold text-gray-700">{config.name}</div>
                        <div className="text-lg font-bold text-green-600">{config.points} pts</div>
                        <div className="text-xs text-gray-500">
                          {type === 'coin' && 'Commun'}
                          {type === 'gem' && 'Rare'}
                          {type === 'crown' && 'Très rare'}
                          {type === 'chest' && 'Ultra-rare'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Statistiques du Joueur
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{treasurePlayerStats.totalScore}</div>
                      <div className="text-sm text-gray-600">Score Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{treasurePlayerStats.treasuresFound.coins}</div>
                      <div className="text-sm text-gray-600">🪙 Pièces</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{treasurePlayerStats.treasuresFound.gems}</div>
                      <div className="text-sm text-gray-600">💎 Gemmes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{treasurePlayerStats.treasuresFound.crowns}</div>
                      <div className="text-sm text-gray-600">👑 Couronnes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{treasurePlayerStats.treasuresFound.chests}</div>
                      <div className="text-sm text-gray-600">⚱️ Coffres</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={initTreasureDig}
                    disabled={!canDig()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      canDig() 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Pickaxe className="w-5 h-5" />
                    Nouvelle Fouille
                  </button>
                </div>

                {showTreasureResults && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-blue-800 mb-4">Fouille Terminée !</h2>
                        <div className="space-y-2 mb-6">
                          <div className="text-lg">Score: <span className="font-bold text-blue-600">{treasureDigState.score} points</span></div>
                          <div>Trésors trouvés: {treasureDigState.foundTreasures.length}</div>
                          <div className="border-t pt-2 mt-2">
                            {treasureDigState.foundTreasures.map((treasure, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span>{TREASURES[treasure.type].emoji} {treasure.name}</span>
                                <span className="font-bold text-green-600">+{treasure.points}</span>
                              </div>
                            ))}
                          </div>
                          {treasureDigState.foundTreasures.some(t => t.type === 'chest') && (
                            <div className="text-purple-600 font-semibold">🎉 Bonus surprise du coffre légendaire !</div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowTreasureResults(false)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

        {showTreasureHunterMemoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F5E6D3] p-6 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border-4 border-[#8B4513]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="quest-title">
                  🏴‍☠️ Treasure Hunter Memory
                </h3>
                <button
                  onClick={() => setShowTreasureHunterMemoryModal(false)}
                  className="text-[#FFD700] hover:text-[#DAA520] text-2xl font-bold drop-shadow-md"
                >
                  ×
                </button>
              </div>
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
                    🏴‍☠️ Treasure Hunter Memory 🏴‍☠️
                  </h1>
                  <p className="text-lg text-blue-200">
                    Mémorise l'emplacement des trésors pirates !
                  </p>
                </div>

                <div className="flex justify-center gap-8 mb-6">
                  <div className="bg-amber-700 px-4 py-2 rounded-lg">
                    <span className="text-yellow-100">Niveau: </span>
                    <span className="text-yellow-300 font-bold">{treasureHunterMemoryState.level}</span>
                  </div>
                  <div className="bg-green-700 px-4 py-2 rounded-lg">
                    <span className="text-green-100">Score: </span>
                    <span className="text-green-300 font-bold">{treasureHunterMemoryState.score}</span>
                  </div>
                  <div className="bg-red-700 px-4 py-2 rounded-lg">
                    <span className="text-red-100">Vies: </span>
                    <span className="text-red-300 font-bold">{'❤️'.repeat(treasureHunterMemoryState.lives)}</span>
                  </div>
                </div>

                {treasureHunterMemoryShowingAll && (
                  <div className="text-center mb-4">
                    <p className="text-xl text-yellow-300 animate-pulse">
                      📖 Mémorise bien les emplacements ! ⏰
                    </p>
                  </div>
                )}

                {!treasureHunterMemoryState.isPlaying && !treasureHunterMemoryState.gameOver && !treasureHunterMemoryState.gameWon && treasureHunterMemoryState.level === 1 && (
                  <div className="text-center">
                    <div className="bg-black bg-opacity-50 p-8 rounded-lg mb-6">
                      <h2 className="text-2xl mb-4 text-yellow-400">Prêt à partir à l'aventure ?</h2>
                      <p className="mb-4 text-blue-200">
                        Trouve les paires d'objets pirates cachés !<br/>
                        Tu as 3 vies et le nombre de cartes augmente à chaque niveau.
                      </p>
                      <button
                        onClick={startTreasureHunterMemory}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
                                 px-8 py-3 rounded-lg font-bold text-xl transition-all duration-200
                                 border-2 border-red-500 hover:border-red-400"
                      >
                        🚀 Commencer l'Aventure !
                      </button>
                    </div>
                  </div>
                )}

                {(treasureHunterMemoryState.isPlaying || treasureHunterMemoryShowingAll) && (
                  <div className={`
                    grid gap-3 justify-center mx-auto max-w-4xl
                    ${getTreasureHunterMemoryGridCols() === 5 ? 'grid-cols-5' : getTreasureHunterMemoryGridCols() === 4 ? 'grid-cols-4' : 'grid-cols-6'}
                  `}>
                    {treasureHunterMemoryCards.map(card => (
                      <TreasureHunterMemoryCard key={card.id} card={card} />
                    ))}
                  </div>
                )}

                {treasureHunterMemoryState.gameOver && (
                  <div className="text-center">
                    <div className="bg-red-900 bg-opacity-80 p-8 rounded-lg border-2 border-red-500">
                      <h2 className="text-3xl mb-4 text-red-300">💀 Game Over ! 💀</h2>
                      <p className="text-xl mb-4">
                        Tu as coulé avec ton navire...<br/>
                        Score final: <span className="text-yellow-400 font-bold">{treasureHunterMemoryState.score}</span>
                      </p>
                      <button
                        onClick={startTreasureHunterMemory}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                 px-6 py-3 rounded-lg font-bold transition-all duration-200"
                      >
                        🔄 Rejouer
                      </button>
                    </div>
                  </div>
                )}

                {treasureHunterMemoryState.gameWon && (
                  <div className="text-center">
                    <div className="bg-yellow-600 bg-opacity-80 p-8 rounded-lg border-2 border-yellow-400">
                      <h2 className="text-3xl mb-4 text-yellow-100">🏆 Victoire Légendaire ! 🏆</h2>
                      <p className="text-xl mb-4 text-yellow-200">
                        Tu es un vrai capitaine pirate !<br/>
                        Score final: <span className="text-white font-bold">{treasureHunterMemoryState.score}</span>
                      </p>
                      <button
                        onClick={startTreasureHunterMemory}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                                 px-6 py-3 rounded-lg font-bold transition-all duration-200"
                      >
                        🆕 Nouvelle Aventure
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 text-center">
                  <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">Comment jouer :</h3>
                    <p className="text-sm text-blue-200">
                      • Mémorise les cartes pendant 3 secondes<br/>
                      • Clique sur deux cartes pour les retourner<br/>
                      • Trouve toutes les paires pour passer au niveau suivant<br/>
                      • Attention : tu perds une vie à chaque erreur !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}