
import React, { useState, useEffect, useCallback } from 'react';
import { Coins, Layers, Crown, User, ArrowRight, Play, Hammer, Info, Castle, Sparkles, Ghost, X, Swords, Wand, Hand, RefreshCw, Trash2 } from 'lucide-react';
import { GameState, GamePhase, Player, Character, District, CharacterName } from './types';
import { CHARACTERS, INITIAL_DECK } from './constants';
import { shuffle, drawCards } from './services/gameService';
import { DistrictCard, CharacterCard } from './components/CardComponents';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    deck: [],
    characterDeck: [],
    availableCharacters: [],
    draftIndex: 0,
    currentTurnRank: 0,
    activePlayerId: null,
    phase: GamePhase.SETUP,
    districtsBuiltThisTurn: 0,
    bonusCollected: false,
    assassinatedRank: null,
    robbedRank: null,
    turnAbilityUsed: false,
    warlordDestroying: false,
  });

  // Modal State
  const [modalType, setModalType] = useState<'ASSASSIN' | 'THIEF' | 'MAGICIAN_TYPE' | 'MAGICIAN_DECKSWAP' | 'MAGICIAN_PLAYERSWAP' | null>(null);
  const [magicianSelectedCards, setMagicianSelectedCards] = useState<string[]>([]);

  const startDraft = useCallback(() => {
    setGameState(prev => {
        // Rotate start player (simplification: usually King determines start)
        const currentKing = prev.players.find(p => p.character?.name === 'King');
        // Simple rotation for now or maintain King logic if implemented fully
        const resetPlayers = prev.players.map(p => ({ ...p, character: null }));
        
        return {
          ...prev,
          players: resetPlayers,
          phase: GamePhase.DRAFT_TRANSITION,
          availableCharacters: shuffle([...CHARACTERS]),
          draftIndex: 0,
          activePlayerId: prev.players[0].id,
          districtsBuiltThisTurn: 0,
          bonusCollected: false,
          assassinatedRank: null,
          robbedRank: null,
          turnAbilityUsed: false,
          warlordDestroying: false,
        };
    });
  }, []);

  const nextRank = useCallback(() => {
     setGameState(prev => {
        // Check if we are done with rank 8
        if (prev.currentTurnRank >= 8) {
          return {
             ...prev,
             phase: GamePhase.ROUND_TRANSITION,
             currentTurnRank: prev.currentTurnRank + 1, // Will trigger end of round check
             activePlayerId: null,
             districtsBuiltThisTurn: 0,
             bonusCollected: false,
             turnAbilityUsed: false,
             warlordDestroying: false,
          };
        }

        return {
          ...prev,
          phase: GamePhase.ROUND_TRANSITION,
          currentTurnRank: prev.currentTurnRank + 1,
          activePlayerId: null,
          districtsBuiltThisTurn: 0,
          bonusCollected: false,
          turnAbilityUsed: false,
          warlordDestroying: false,
        };
     });
  }, []);

  // Effect: Manage Turn Sequence (Rank 1 to 8)
  useEffect(() => {
    if (gameState.phase === GamePhase.ROUND_TRANSITION) {
      // 1. Check End of Round
      if (gameState.currentTurnRank > 8) {
         startDraft();
         return;
      }

      const activeCharacter = CHARACTERS.find(c => c.rank === gameState.currentTurnRank);
      const activePlayer = gameState.players.find(p => p.character?.rank === gameState.currentTurnRank);

      // 2. Check for Assassination (Turn Skip)
      if (gameState.assassinatedRank === gameState.currentTurnRank) {
          const timer = setTimeout(() => {
            nextRank();
          }, 4000); 
          return () => clearTimeout(timer);
      }

      if (activePlayer) {
        // 3. Thief Logic: Transfer Gold immediately if this player was robbed
        if (gameState.robbedRank === gameState.currentTurnRank) {
           setGameState(prev => {
              const thiefPlayerIdx = prev.players.findIndex(p => p.character?.name === 'Thief');
              const victimPlayerIdx = prev.players.findIndex(p => p.id === activePlayer.id);
              
              if (thiefPlayerIdx === -1 || victimPlayerIdx === -1) return prev; // Safety

              const updatedPlayers = [...prev.players];
              const stolenAmount = updatedPlayers[victimPlayerIdx].gold;
              
              updatedPlayers[victimPlayerIdx].gold = 0;
              updatedPlayers[thiefPlayerIdx].gold += stolenAmount;

              return {
                 ...prev,
                 players: updatedPlayers
              };
           });
           // Note: We don't return here, we fall through to set Active Player
        }

        // 4. Set Active Player
        if (gameState.activePlayerId !== activePlayer.id) {
           setGameState(prev => ({ ...prev, activePlayerId: activePlayer.id }));
        }
      } else {
        // 5. No player has this character (skipped/discarded)
        const timer = setTimeout(() => {
           nextRank();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.phase, gameState.currentTurnRank, gameState.players, gameState.assassinatedRank, gameState.robbedRank, nextRank, startDraft]);

  const startGame = () => {
    startDraft();
  };

  const handleDraftReady = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.DRAFT_PICK }));
  };

  const handleDraftPick = (character: Character) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map((p, index) => {
        if (index === prev.draftIndex) return { ...p, character: character };
        return p;
      });
      const remainingCharacters = prev.availableCharacters.filter(c => c.name !== character.name);
      const nextDraftIndex = prev.draftIndex + 1;
      
      if (nextDraftIndex < prev.players.length) {
        return {
          ...prev,
          players: updatedPlayers,
          availableCharacters: remainingCharacters,
          draftIndex: nextDraftIndex,
          activePlayerId: prev.players[nextDraftIndex].id,
          phase: GamePhase.DRAFT_TRANSITION
        };
      } else {
        return {
          ...prev,
          players: updatedPlayers,
          availableCharacters: remainingCharacters,
          draftIndex: 0,
          currentTurnRank: 1, 
          phase: GamePhase.ROUND_TRANSITION,
          activePlayerId: null, 
          districtsBuiltThisTurn: 0,
          bonusCollected: false,
          assassinatedRank: null,
          robbedRank: null,
          turnAbilityUsed: false,
          warlordDestroying: false,
        };
      }
    });
  };

  const startTurn = () => {
    setGameState(prev => ({ 
      ...prev, 
      phase: GamePhase.ROUND_TURN,
      districtsBuiltThisTurn: 0,
      bonusCollected: false,
      turnAbilityUsed: false,
      warlordDestroying: false,
    }));
  };

  const handleAction = (action: 'GOLD' | 'DRAW') => {
    setGameState(prev => {
       if (!prev.activePlayerId) return prev;
       const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
       if (activeIdx === -1) return prev;

       const updatedPlayers = [...prev.players];
       const player = { ...updatedPlayers[activeIdx] };
       let updatedDeck = [...prev.deck];

       if (action === 'GOLD') {
          player.gold += 2;
       } else {
          const { drawn, remaining } = drawCards(updatedDeck, 2);
          player.hand = [...player.hand, ...drawn];
          updatedDeck = remaining;
       }

       // Passive Abilities
       if (player.character?.name === 'Merchant') player.gold += 1;
       if (player.character?.name === 'Architect') {
         const { drawn, remaining } = drawCards(updatedDeck, 2);
         player.hand = [...player.hand, ...drawn];
         updatedDeck = remaining;
       }

       updatedPlayers[activeIdx] = player;
       return { ...prev, players: updatedPlayers, deck: updatedDeck, phase: GamePhase.ROUND_BUILD };
    });
  };

  const handleCollectBonus = () => {
    setGameState(prev => {
      const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
      if (activeIdx === -1 || prev.bonusCollected) return prev;

      const player = { ...prev.players[activeIdx] };
      const targetColor = player.character?.name === 'King' ? 'yellow' 
                        : player.character?.name === 'Bishop' ? 'blue'
                        : player.character?.name === 'Merchant' ? 'green'
                        : player.character?.name === 'Warlord' ? 'red' : '';
      
      const count = player.builtDistricts.reduce((acc, d) => (d.color === targetColor || d.name === 'School of Magic' ? acc + 1 : acc), 0);
      if (count > 0) player.gold += count;

      const updatedPlayers = [...prev.players];
      updatedPlayers[activeIdx] = player;
      return { ...prev, players: updatedPlayers, bonusCollected: true };
    });
  };

  const handleBuild = (district: District) => {
    setGameState(prev => {
      const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
      if (activeIdx === -1) return prev;

      const player = { ...prev.players[activeIdx] };
      if (player.gold < district.cost) return prev;
      if (player.builtDistricts.some(d => d.name === district.name)) return prev;

      const buildLimit = player.character?.name === 'Architect' ? 3 : 1;
      if (prev.districtsBuiltThisTurn >= buildLimit) return prev;

      player.gold -= district.cost;
      player.hand = player.hand.filter(c => c.id !== district.id);
      player.builtDistricts = [...player.builtDistricts, district];

      const updatedPlayers = [...prev.players];
      updatedPlayers[activeIdx] = player;
      return { ...prev, players: updatedPlayers, districtsBuiltThisTurn: prev.districtsBuiltThisTurn + 1 };
    });
  };

  // --- ACTIVE ABILITIES ---

  const handleAssassinate = (targetRank: number) => {
    setGameState(prev => ({ ...prev, assassinatedRank: targetRank, turnAbilityUsed: true }));
    setModalType(null);
  };

  const handleThiefSteal = (targetRank: number) => {
    setGameState(prev => ({ ...prev, robbedRank: targetRank, turnAbilityUsed: true }));
    setModalType(null);
  };

  const handleMagicianSwapPlayer = (targetPlayerId: number) => {
    setGameState(prev => {
       const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
       const targetIdx = prev.players.findIndex(p => p.id === targetPlayerId);
       if (activeIdx === -1 || targetIdx === -1) return prev;

       const updatedPlayers = [...prev.players];
       // Swap hands
       const tempHand = [...updatedPlayers[activeIdx].hand];
       updatedPlayers[activeIdx].hand = [...updatedPlayers[targetIdx].hand];
       updatedPlayers[targetIdx].hand = tempHand;

       return { ...prev, players: updatedPlayers, turnAbilityUsed: true };
    });
    setModalType(null);
  };

  const handleMagicianSwapDeck = () => {
    if (magicianSelectedCards.length === 0) return;
    setGameState(prev => {
       const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
       if (activeIdx === -1) return prev;

       const updatedPlayers = [...prev.players];
       const player = { ...updatedPlayers[activeIdx] };
       let updatedDeck = [...prev.deck];

       // Remove selected cards
       player.hand = player.hand.filter(c => !magicianSelectedCards.includes(c.id));
       // Add removed cards to bottom of deck (simplification)
       // Draw new cards
       const { drawn, remaining } = drawCards(updatedDeck, magicianSelectedCards.length);
       player.hand = [...player.hand, ...drawn];
       updatedDeck = remaining;

       updatedPlayers[activeIdx] = player;
       return { ...prev, players: updatedPlayers, deck: updatedDeck, turnAbilityUsed: true };
    });
    setModalType(null);
    setMagicianSelectedCards([]);
  };

  const handleWarlordDestroy = (targetPlayerId: number, district: District) => {
     setGameState(prev => {
        const activeIdx = prev.players.findIndex(p => p.id === prev.activePlayerId);
        const targetIdx = prev.players.findIndex(p => p.id === targetPlayerId);
        if (activeIdx === -1 || targetIdx === -1) return prev;

        const warlord = { ...prev.players[activeIdx] };
        const target = { ...prev.players[targetIdx] };
        const destroyCost = district.cost - 1;

        if (warlord.gold < destroyCost) return prev;

        // Check immunity (Bishop)
        if (target.character?.name === 'Bishop') return prev; 
        // Warlord cannot destroy completed city (8 districts) - House rule, typically bishop checks are enough

        warlord.gold -= destroyCost;
        target.builtDistricts = target.builtDistricts.filter(d => d.id !== district.id);

        const updatedPlayers = [...prev.players];
        updatedPlayers[activeIdx] = warlord;
        updatedPlayers[targetIdx] = target;

        return { ...prev, players: updatedPlayers, turnAbilityUsed: true, warlordDestroying: false };
     });
  };


  // --- INITIAL RENDER SAFEGUARDS ---
  useEffect(() => {
    let currentDeck = shuffle([...INITIAL_DECK]);
    const initialPlayers: Player[] = [];
    for (let i = 1; i <= 4; i++) {
      const { drawn, remaining } = drawCards(currentDeck, 4);
      currentDeck = remaining;
      initialPlayers.push({ id: i, name: `Player ${i}`, gold: 2, hand: drawn, builtDistricts: [], character: null });
    }
    setGameState({
      players: initialPlayers, deck: currentDeck, characterDeck: [], availableCharacters: [],
      draftIndex: 0, currentTurnRank: 0, activePlayerId: 1, phase: GamePhase.SETUP,
      districtsBuiltThisTurn: 0, bonusCollected: false, assassinatedRank: null, robbedRank: null, turnAbilityUsed: false, warlordDestroying: false
    });
  }, []);

  const ActivePlayer = gameState.players.find(p => p.id === gameState.activePlayerId);
  const CurrentCharacterObj = CHARACTERS.find(c => c.rank === gameState.currentTurnRank);
  
  if (gameState.players.length === 0 || !ActivePlayer) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Realm...</div>;

  // Helpers for UI
  const buildLimit = ActivePlayer.character?.name === 'Architect' ? 3 : 1;
  const remainingBuilds = buildLimit - gameState.districtsBuiltThisTurn;
  const potentialBonus = (['King', 'Bishop', 'Merchant', 'Warlord'].includes(ActivePlayer.character?.name || '')) 
     ? gameState.players.find(p => p.id === gameState.activePlayerId)?.builtDistricts.reduce((acc, d) => {
        const color = ActivePlayer.character?.name === 'King' ? 'yellow' : ActivePlayer.character?.name === 'Bishop' ? 'blue' : ActivePlayer.character?.name === 'Merchant' ? 'green' : 'red';
        return (d.color === color || d.name === 'School of Magic') ? acc + 1 : acc;
     }, 0) || 0 : 0;
  
  const showBonusButton = potentialBonus > 0 && !gameState.bonusCollected;
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center font-sans">
      <header className="mb-8 w-full max-w-5xl flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-slate-900"><Crown size={24} /></div>
          <div><h1 className="text-2xl font-bold font-serif text-amber-500">Citadel Realms</h1><p className="text-xs text-slate-400">Strategy Card Game</p></div>
        </div>
        <div className="flex items-center gap-4">
           {gameState.phase === GamePhase.SETUP ? 
             <button onClick={startGame} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold transition-colors">Start Game</button> 
             : <div className="px-3 py-1 bg-slate-900 rounded border border-slate-800 text-sm">Phase: <span className="text-amber-400 font-bold">{gameState.phase}</span></div>
           }
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-8 relative overflow-hidden">
        
        {/* SETUP */}
        {gameState.phase === GamePhase.SETUP && <div className="text-center text-slate-400 z-10"><Crown size={64} className="mx-auto mb-4 opacity-20" /><p>Press Start to begin.</p></div>}

        {/* DRAFT TRANSITION */}
        {gameState.phase === GamePhase.DRAFT_TRANSITION && (
          <div className="text-center z-10 animate-in fade-in zoom-in duration-300">
             <div className="mb-6"><User size={64} className="mx-auto text-slate-600 mb-4" /><h2 className="text-3xl font-serif text-slate-200 mb-2">Pass to</h2><h1 className="text-5xl font-serif font-bold text-amber-500 mb-8">{ActivePlayer.name}</h1></div>
             <button onClick={handleDraftReady} className="group flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-8 py-4 rounded-xl text-xl font-bold transition-all">I am {ActivePlayer.name}, Ready!<ArrowRight className="group-hover:translate-x-1 transition-transform" /></button>
          </div>
        )}

        {/* DRAFT PICK */}
        {gameState.phase === GamePhase.DRAFT_PICK && (
           <div className="w-full h-full flex flex-col items-center z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif text-amber-100 mb-6">Choose Your Character</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {gameState.availableCharacters.map((char) => <CharacterCard key={char.name} character={char} onClick={() => handleDraftPick(char)} />)}
              </div>
           </div>
        )}

        {/* ROUND TRANSITION */}
        {gameState.phase === GamePhase.ROUND_TRANSITION && (
          <div className="text-center z-10 animate-in fade-in duration-300">
             <div className="mb-8">
               <p className="text-slate-500 text-sm uppercase tracking-widest mb-2">Calling Rank {gameState.currentTurnRank}</p>
               <h1 className="text-4xl font-serif font-bold text-slate-200 mb-4">{CurrentCharacterObj ? CurrentCharacterObj.name : 'Unknown'}</h1>
               {gameState.assassinatedRank === gameState.currentTurnRank ? 
                  <div className="text-red-500 text-2xl font-bold animate-pulse flex flex-col items-center gap-2"><Ghost size={48} /><p>ASSASSINATED!</p></div> 
                  : (!gameState.activePlayerId ? <div className="text-slate-500 italic">Waiting...</div> 
                  : <div className="text-amber-500 text-xl">Played by <span className="font-bold">{ActivePlayer.name}</span></div>)}
             </div>
             {gameState.activePlayerId && !gameState.assassinatedRank && 
               <button onClick={startTurn} className="bg-amber-600 hover:bg-amber-500 text-slate-900 px-8 py-3 rounded-xl text-xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"><Play fill="currentColor" /> Start Turn</button>
             }
          </div>
        )}

        {/* PLAY AREA */}
        {(gameState.phase === GamePhase.ROUND_TURN || gameState.phase === GamePhase.ROUND_BUILD) && (
          <div className="w-full h-full flex flex-col items-center z-10 animate-in fade-in duration-300">
            {/* Turn Header */}
            <div className="text-center mb-8 relative">
               <h2 className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-2 drop-shadow-sm">{ActivePlayer.name}'s Turn</h2>
               <div className="flex flex-col items-center">
                 <div className="relative z-20 flex items-center gap-3 bg-slate-900 text-slate-200 px-5 py-2 rounded-full border border-slate-700 shadow-lg">
                   <div className={`w-3 h-3 rounded-full ${ActivePlayer.character?.color ? ActivePlayer.character.color.replace('border-', 'bg-') : 'bg-slate-500'}`}></div>
                   <span className="font-bold uppercase tracking-widest text-sm">{ActivePlayer.character?.name || 'Unknown'}</span>
                 </div>
                 {/* Ability Tooltip */}
                 {ActivePlayer.character?.description && (
                   <div className="mt-3 bg-slate-800/90 text-amber-100 text-sm px-6 py-2 rounded-xl border border-amber-500/30 shadow-xl relative z-10 flex items-center gap-2">
                       <Info size={14} className="text-amber-500" /> <span className="italic">"{ActivePlayer.character.description}"</span>
                   </div>
                 )}
               </div>
            </div>

            {/* ACTION CHOICE */}
            {gameState.phase === GamePhase.ROUND_TURN && (
              <div className="flex gap-8 mb-8">
                <button onClick={() => handleAction('GOLD')} className="w-48 h-48 bg-slate-800 rounded-2xl border-2 border-amber-500/50 hover:border-amber-500 hover:bg-slate-700 transition-all flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="p-4 bg-amber-500/10 rounded-full"><Coins size={48} className="text-amber-500" /></div>
                  <div className="text-center"><h3 className="font-bold text-xl text-slate-200">Take Gold</h3><p className="text-sm text-slate-400">{ActivePlayer.character?.name === 'Merchant' ? '+3 Gold' : '+2 Gold'}</p></div>
                </button>
                <button onClick={() => handleAction('DRAW')} className="w-48 h-48 bg-slate-800 rounded-2xl border-2 border-slate-500/50 hover:border-slate-300 hover:bg-slate-700 transition-all flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="p-4 bg-slate-500/10 rounded-full"><Layers size={48} className="text-slate-300" /></div>
                  <div className="text-center"><h3 className="font-bold text-xl text-slate-200">Draw Cards</h3><p className="text-sm text-slate-400">{ActivePlayer.character?.name === 'Architect' ? '+4 Cards' : '+2 Cards'}</p></div>
                </button>
              </div>
            )}

            {/* BUILD & ABILITY CONTROLS */}
            {gameState.phase === GamePhase.ROUND_BUILD && (
               <div className="flex flex-col items-center gap-4 mb-8">
                 <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* Character Specific Buttons */}
                    {showBonusButton && (
                      <button onClick={handleCollectBonus} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2 rounded-full font-bold shadow-lg">
                        <Sparkles size={16} /> Collect {potentialBonus} Gold
                      </button>
                    )}
                    
                    {ActivePlayer.character?.name === 'Assassin' && !gameState.turnAbilityUsed && (
                       <button onClick={() => setModalType('ASSASSIN')} className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500/50 px-5 py-2 rounded-full font-bold"><Ghost size={16} /> Assassinate</button>
                    )}
                    {ActivePlayer.character?.name === 'Thief' && !gameState.turnAbilityUsed && (
                       <button onClick={() => setModalType('THIEF')} className="flex items-center gap-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 px-5 py-2 rounded-full font-bold"><User size={16} /> Steal Gold</button>
                    )}
                    {ActivePlayer.character?.name === 'Magician' && !gameState.turnAbilityUsed && (
                       <button onClick={() => setModalType('MAGICIAN_TYPE')} className="flex items-center gap-2 bg-violet-900/50 hover:bg-violet-800 text-violet-200 border border-violet-500/50 px-5 py-2 rounded-full font-bold"><Wand size={16} /> Cast Spell</button>
                    )}
                    {ActivePlayer.character?.name === 'Warlord' && !gameState.turnAbilityUsed && (
                       <button onClick={() => setGameState(prev => ({...prev, warlordDestroying: !prev.warlordDestroying}))} className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold border transition-colors ${gameState.warlordDestroying ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-red-900/50 text-red-200 border-red-500/50'}`}>
                         <Swords size={16} /> {gameState.warlordDestroying ? 'Select District to Destroy' : 'Destroy District'}
                       </button>
                    )}
                 </div>

                 <div className="flex flex-col items-center text-center p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-emerald-200 min-w-[250px]">
                    <h3 className="flex items-center gap-2 font-bold text-emerald-400 mb-1"><Hammer size={16} /> Build Phase</h3>
                    <div className="text-xs">Builds left: <b>{remainingBuilds}</b></div>
                 </div>
                 
                 <button onClick={nextRank} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-8 py-3 rounded-lg font-bold shadow-lg">End Turn</button>
               </div>
            )}

            {/* Hand */}
            <div className="mt-auto p-6 bg-slate-900/80 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm w-full max-w-4xl">
              <div className="flex justify-between items-center mb-4"><p className="text-sm text-slate-500 uppercase tracking-wider font-bold flex items-center gap-2"><Layers size={14} /> Your Hand</p><span className="text-amber-400 font-bold flex items-center gap-1"><Coins size={16} /> {ActivePlayer.gold} Gold</span></div>
              <div className="flex justify-center gap-4 flex-wrap">
                {ActivePlayer && ActivePlayer.hand.map((card, i) => {
                  const canAfford = ActivePlayer.gold >= card.cost;
                  const hasBuilt = ActivePlayer.builtDistricts.some(d => d.name === card.name);
                  const canBuild = gameState.phase === GamePhase.ROUND_BUILD && canAfford && !hasBuilt && remainingBuilds > 0;
                  return <DistrictCard key={i} district={card} mini canBuild={canBuild} onClick={canBuild ? () => handleBuild(card) : undefined} />;
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REALM OVERVIEW */}
      <section className="w-full max-w-5xl mt-6 p-6 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6 opacity-70"><Castle size={14} /> <span className="text-slate-400 uppercase tracking-[0.2em] text-xs font-serif font-bold">Kingdoms Overview</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameState.players.map(p => {
            const isActive = gameState.activePlayerId === p.id;
            const isWarlordTarget = gameState.warlordDestroying && !isActive && p.character?.name !== 'Bishop' && p.builtDistricts.length < 8;
            
            return (
              <div key={p.id} className={`bg-slate-950/80 rounded-xl p-4 border transition-all duration-500 relative overflow-hidden ${isActive ? 'border-amber-500/40' : 'border-slate-800'} ${isWarlordTarget ? 'ring-2 ring-red-500/50 cursor-crosshair' : ''}`}>
                <div className="flex justify-between items-baseline mb-3 pl-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-serif font-bold ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>{p.name}</span>
                    {p.character && <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">{p.character.name}</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex gap-3 font-mono"><span className="flex items-center gap-1"><Coins size={12} className="text-amber-500/80" />{p.gold}</span><span className="flex items-center gap-1"><Layers size={12} className="text-slate-400" />{p.hand.length}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[4rem] rounded-lg p-2 bg-black/40 border border-slate-800/50">
                  {p.builtDistricts.map((d, i) => (
                    <div key={`${d.id}-${i}`} className="relative group" onClick={() => {
                        if (isWarlordTarget) handleWarlordDestroy(p.id, d);
                    }}>
                       <DistrictCard district={d} tiny />
                       {isWarlordTarget && <div className="absolute inset-0 bg-red-500/40 hidden group-hover:flex items-center justify-center cursor-pointer rounded"><Trash2 size={16} className="text-white" /></div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- MODALS --- */}
      
      {/* 1. ASSASSIN / THIEF Modal (Select Character) */}
      {(modalType === 'ASSASSIN' || modalType === 'THIEF') && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                     {modalType === 'ASSASSIN' ? <><Ghost className="text-red-500" /> Assassinate Character</> : <><User className="text-emerald-500" /> Steal Gold</>}
                  </h3>
                  <button onClick={() => setModalType(null)}><X size={24} className="text-slate-500 hover:text-white" /></button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CHARACTERS.map(char => {
                     // Filter valid targets
                     if (char.rank <= gameState.currentTurnRank) return null; // Can't target past/current
                     if (modalType === 'THIEF' && (char.name === 'Assassin' || char.rank === gameState.assassinatedRank)) return null; // Thief rules
                     
                     return (
                        <button key={char.rank} onClick={() => modalType === 'ASSASSIN' ? handleAssassinate(char.rank) : handleThiefSteal(char.rank)} className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center transition-all">
                           <div className="font-bold text-slate-200">{char.name}</div>
                           <div className="text-xs text-slate-500">Rank {char.rank}</div>
                        </button>
                     );
                  })}
               </div>
            </div>
         </div>
      )}

      {/* 2. MAGICIAN TYPE SELECTION */}
      {modalType === 'MAGICIAN_TYPE' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-8 flex flex-col gap-4">
               <h3 className="text-xl font-bold text-slate-200 text-center mb-2"><Wand className="inline mr-2 text-violet-500" /> Cast Spell</h3>
               <button onClick={() => setModalType('MAGICIAN_PLAYERSWAP')} className="p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center gap-4 group transition-all">
                  <div className="bg-violet-900/30 p-3 rounded-full"><User size={24} className="text-violet-400" /></div>
                  <div className="text-left"><div className="font-bold text-lg text-slate-200">Swap Hands with Player</div><div className="text-sm text-slate-400">Exchange all your cards with another player.</div></div>
               </button>
               <button onClick={() => setModalType('MAGICIAN_DECKSWAP')} className="p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center gap-4 group transition-all">
                  <div className="bg-violet-900/30 p-3 rounded-full"><RefreshCw size={24} className="text-violet-400" /></div>
                  <div className="text-left"><div className="font-bold text-lg text-slate-200">Exchange with Deck</div><div className="text-sm text-slate-400">Discard any number of cards and draw equal new ones.</div></div>
               </button>
               <button onClick={() => setModalType(null)} className="mt-2 text-slate-500 hover:text-slate-300">Cancel</button>
            </div>
         </div>
      )}

      {/* 3. MAGICIAN PLAYER SWAP */}
      {modalType === 'MAGICIAN_PLAYERSWAP' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                <h3 className="text-xl font-bold text-slate-200 mb-6">Select Player to Swap With</h3>
                <div className="flex flex-col gap-3">
                   {gameState.players.map(p => {
                      if (p.id === gameState.activePlayerId) return null;
                      return (
                         <button key={p.id} onClick={() => handleMagicianSwapPlayer(p.id)} className="flex items-center justify-between p-4 bg-slate-800 hover:bg-violet-900/20 border border-slate-700 hover:border-violet-500/50 rounded-xl">
                            <span className="font-bold text-slate-200">{p.name}</span>
                            <span className="text-sm text-slate-500">{p.hand.length} Cards</span>
                         </button>
                      );
                   })}
                </div>
                <button onClick={() => setModalType(null)} className="mt-6 w-full py-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white">Cancel</button>
             </div>
         </div>
      )}

      {/* 4. MAGICIAN DECK SWAP */}
      {modalType === 'MAGICIAN_DECKSWAP' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-bold text-slate-200">Select Cards to Discard</h3>
                   <button onClick={() => {setModalType(null); setMagicianSelectedCards([])}}><X size={24} className="text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
                   {ActivePlayer.hand.map((card, i) => (
                      <div key={i} onClick={() => {
                         if (magicianSelectedCards.includes(card.id)) setMagicianSelectedCards(prev => prev.filter(id => id !== card.id));
                         else setMagicianSelectedCards(prev => [...prev, card.id]);
                      }} className={`relative cursor-pointer transition-all ${magicianSelectedCards.includes(card.id) ? 'ring-4 ring-violet-500 scale-95 opacity-50' : ''}`}>
                         <DistrictCard district={card} mini />
                         {magicianSelectedCards.includes(card.id) && <div className="absolute inset-0 flex items-center justify-center"><RefreshCw size={32} className="text-violet-200 drop-shadow-lg" /></div>}
                      </div>
                   ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-4">
                   <div className="flex-1 text-slate-500 text-sm flex items-center">Selected: {magicianSelectedCards.length} cards</div>
                   <button onClick={handleMagicianSwapDeck} disabled={magicianSelectedCards.length === 0} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold">Exchange</button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
}
