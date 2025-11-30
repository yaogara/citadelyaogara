import React, { useEffect, useState } from 'react';
import { CharacterMeta, DistrictMeta } from '../types';
import { Crown, Coins, Scroll, Shield, Ghost, Cross, Tent, Hammer, Swords, Map } from 'lucide-react';
import { CARD_IMAGE_PLACEHOLDER } from '../cardMetadata';

interface CharacterCardProps {
  character: CharacterMeta;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  hidden?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick, disabled, selected, hidden }) => {
  if (hidden) {
    return (
      <div className="w-40 h-64 bg-slate-800 border-2 border-slate-700 rounded-xl shadow-xl flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900">
        <div className="text-slate-600">
          <Crown size={48} opacity={0.2} />
        </div>
      </div>
    );
  }

  const getIcon = (name: string) => {
    switch (name) {
      case 'Assassin': return <Ghost size={32} className="text-slate-400" />;
      case 'Thief': return <Map size={32} className="text-emerald-400" />;
      case 'Magician': return <Scroll size={32} className="text-violet-400" />;
      case 'King': return <Crown size={32} className="text-amber-400" />;
      case 'Bishop': return <Cross size={32} className="text-blue-400" />;
      case 'Merchant': return <Coins size={32} className="text-green-400" />;
      case 'Architect': return <Hammer size={32} className="text-slate-400" />;
      case 'Warlord': return <Swords size={32} className="text-red-500" />;
      default: return <Crown size={32} />;
    }
  };

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-40 h-64 rounded-xl shadow-2xl transition-all duration-300 transform
        flex flex-col overflow-hidden border-2
        ${selected ? 'ring-4 ring-amber-500 scale-105 z-10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-2 card-glow'}
        ${character.color} bg-slate-800
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
      
      {/* Header */}
      <div className="relative p-2 flex justify-between items-center bg-black/30 backdrop-blur-sm border-b border-white/10">
        <span className="font-serif font-bold text-xl text-amber-500">{character.rank}</span>
        <span className="font-serif font-bold text-sm tracking-wider uppercase text-slate-200">{character.name}</span>
      </div>

      {/* Art Placeholder */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-transparent to-black/40">
        <div className="p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/5 shadow-inner">
          {getIcon(character.name)}
        </div>
      </div>

      {/* Description */}
      <div className="relative p-3 bg-black/60 backdrop-blur-sm border-t border-white/10 min-h-[80px]">
        <p className="text-xs text-center text-slate-300 leading-tight italic">
          "{character.description}"
        </p>
      </div>
    </div>
  );
};

interface DistrictCardProps {
  district: DistrictMeta;
  mini?: boolean;
  tiny?: boolean;
  onClick?: () => void;
  canBuild?: boolean;
}

export const DistrictCard: React.FC<DistrictCardProps> = ({ district, mini, tiny, onClick, canBuild }) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(district.image);

  useEffect(() => {
    setImageSrc(district.image);
  }, [district.image]);

  const getColorClass = (color: string) => {
    switch (color) {
      case 'yellow': return 'border-amber-500 bg-amber-900/20';
      case 'green': return 'border-emerald-500 bg-emerald-900/20';
      case 'blue': return 'border-blue-500 bg-blue-900/20';
      case 'red': return 'border-red-500 bg-red-900/20';
      case 'purple': return 'border-purple-500 bg-purple-900/20';
      default: return 'border-slate-500';
    }
  };

  const getIcon = (color: string) => {
     switch (color) {
      case 'yellow': return <Crown size={mini || tiny ? 12 : 24} className="text-amber-500" />;
      case 'green': return <Coins size={mini || tiny ? 12 : 24} className="text-emerald-500" />;
      case 'blue': return <Cross size={mini || tiny ? 12 : 24} className="text-blue-500" />;
      case 'red': return <Shield size={mini || tiny ? 12 : 24} className="text-red-500" />;
      case 'purple': return <Scroll size={mini || tiny ? 12 : 24} className="text-purple-500" />;
      default: return <Tent size={mini || tiny ? 12 : 24} />;
    }
  };

  const interactiveClasses = onClick 
    ? `cursor-pointer transition-transform hover:-translate-y-1 ${canBuild ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}` 
    : '';

  if (tiny) {
    return (
       <div 
        className={`
          w-8 h-12 rounded border flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0 select-none
          ${getColorClass(district.color)}
        `}
        title={`${district.name} - Cost: ${district.cost}`}
      >
         <div className="absolute inset-0 flex items-center justify-center opacity-30">
            {getIcon(district.color)}
         </div>
         <span className="z-10 text-[10px] font-bold text-slate-100 drop-shadow-md">{district.cost}</span>
      </div>
    );
  }

  if (mini) {
    return (
      <div 
        onClick={onClick}
        className={`
          w-20 h-28 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0
          ${getColorClass(district.color)}
          ${interactiveClasses}
        `}
      >
         <div className="absolute top-1 left-1 bg-black/50 rounded-full w-5 h-5 flex items-center justify-center">
            <span className={`text-xs font-bold ${canBuild ? 'text-emerald-400' : 'text-amber-400'}`}>{district.cost}</span>
         </div>
         <div className="mb-1">{getIcon(district.color)}</div>
         <span className="text-[9px] text-center font-bold uppercase truncate w-full px-1">{district.name}</span>
      </div>
    );
  }

  return (
    <div className={`
      w-32 h-48 rounded-lg border-2 shadow-lg relative overflow-hidden flex flex-col
      ${getColorClass(district.color)}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/40 pointer-events-none" />

      {/* Cost Coin */}
      <div className="absolute top-2 left-2 z-10">
        <div className="w-8 h-8 rounded-full bg-amber-500 shadow-lg border-2 border-amber-300 flex items-center justify-center">
          <span className="font-bold text-slate-900 text-lg">{district.cost}</span>
        </div>
      </div>

      {/* Art Area */}
      <div className="flex-1 flex items-center justify-center pt-6 px-2">
        {imageSrc ? (
          <div className="w-full h-full rounded-md overflow-hidden shadow-inner border border-white/10 bg-black/40 flex items-center justify-center">
            <img
              src={imageSrc}
              alt={district.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageSrc(CARD_IMAGE_PLACEHOLDER)}
            />
          </div>
        ) : (
          getIcon(district.color)
        )}
      </div>

      {/* Title */}
      <div className="h-16 bg-slate-900/90 border-t border-white/10 p-2 flex flex-col justify-center items-center text-center z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{district.name}</span>
        <span className="text-[10px] text-slate-400 capitalize">{district.color} District</span>
      </div>
    </div>
  );
};