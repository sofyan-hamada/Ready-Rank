'use client';

import React, { useState, useEffect } from 'react';
import { GamePrice } from '@/lib/db';
import { Plus, Minus, ShoppingCart, ShieldAlert } from 'lucide-react';

interface GameCardProps {
  game: GamePrice;
  onCheckout: (gameId: string, quantity: number, totalPrice: number) => void;
}

export default function GameCard({ game, onCheckout }: GameCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  // Reset quantity if game changes
  useEffect(() => {
    setQuantity(1);
  }, [game]);

  const handleIncrement = () => setQuantity(prev => Math.min(prev + 1, 10));
  const handleDecrement = () => setQuantity(prev => Math.max(prev - 1, 1));

  const totalPrice = quantity * game.price_egp;

  // Map game ID to logo image path
  const getLogoPath = (id: string) => {
    switch (id) {
      case 'marvel-rivals': return '/images/logos/marvel-rivals.png';
      case 'valorant': return '/images/logos/valorant.png';
      case 'siege': return '/images/logos/siege.png';
      case 'overwatch': return '/images/logos/overwatch.png';
      case 'league': return '/images/logos/league.png';
      default: return '';
    }
  };

  // Render fallback glowing SVG icon if image is not uploaded yet
  const renderFallbackLogo = (id: string) => {
    switch (id) {
      case 'marvel-rivals':
        return (
          <svg className="w-16 h-16 text-rose-500 filter drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
      case 'valorant':
        return (
          <svg className="w-16 h-16 text-rose-600 filter drop-shadow-[0_0_10px_rgba(225,29,72,0.6)]" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 20 L45 20 L35 45 L10 20 Z" />
            <path d="M90 20 L55 20 L65 45 L90 20 Z" />
            <path d="M50 45 L35 80 L65 80 L50 45 Z" />
          </svg>
        );
      case 'siege':
        return (
          <svg className="w-16 h-16 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M12 3v18M3 12h18" />
          </svg>
        );
      case 'overwatch':
        return (
          <svg className="w-16 h-16 text-amber-500 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 8 4L12 12 4 6a10 10 0 0 1 8-4z" />
          </svg>
        );
      case 'league':
        return (
          <svg className="w-16 h-16 text-yellow-500 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      default:
        return <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-xs">Game</div>;
    }
  };

  const productBoxLabel = game.id === 'overwatch' ? '50 Wins' : 'Ready Rank';
  const accentColorClass = 
    game.id === 'overwatch' ? 'from-amber-600 to-orange-500 shadow-glow-orange border-orange-500/30' :
    game.id === 'valorant' ? 'from-rose-600 to-red-500 shadow-glow-rose border-rose-500/30' :
    game.id === 'siege' ? 'from-emerald-600 to-teal-500 shadow-glow-emerald border-emerald-500/30' :
    game.id === 'marvel-rivals' ? 'from-fuchsia-600 to-violet-500 shadow-glow-purple border-violet-500/30' :
    'from-yellow-600 to-amber-500 shadow-glow-yellow border-yellow-500/30';

  return (
    <div 
      className="relative flex flex-col h-full rounded-2xl border border-gray-800 bg-[#0b0c16]/50 backdrop-blur-md overflow-hidden group hover:border-gray-700 hover:bg-[#0e0f20]/75 transition-all duration-300 shadow-xl"
      id={`game-card-${game.id}`}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {/* Game Logo Container */}
      <div className="relative flex items-center justify-center h-44 bg-gray-950/40 border-b border-gray-900 overflow-hidden p-6 group-hover:bg-gray-950/20 transition-colors duration-300">
        {!imgError ? (
          <img
            src={getLogoPath(game.id)}
            alt={`${game.name} official logo`}
            onError={() => setImgError(true)}
            className="max-h-28 max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transform group-hover:scale-105 transition-transform duration-300"
            id={`game-logo-${game.id}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {renderFallbackLogo(game.id)}
            <span className="text-[10px] text-gray-500 tracking-wider font-semibold uppercase">Real logo placeholder</span>
          </div>
        )}

        {/* Product Box Tag */}
        <span className="absolute top-3 right-3 text-[10px] uppercase font-extrabold tracking-widest bg-gray-900 border border-gray-800 text-gray-300 px-2.5 py-1 rounded-md shadow-md">
          {productBoxLabel}
        </span>
      </div>

      {/* Card Info */}
      <div className="flex flex-col flex-grow p-5">
        <h3 className="font-display font-bold text-xl text-white tracking-wide mb-2 group-hover:text-cyan-400 transition-colors duration-300">
          {game.name}
        </h3>
        
        <p className="text-xs text-gray-400 leading-relaxed flex-grow mb-4">
          Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.
        </p>

        {/* Price & Quantity Area */}
        <div className="mt-auto pt-4 border-t border-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Price Per Account</span>
              <span className="font-display font-extrabold text-lg text-white">
                {game.price_egp.toLocaleString()} <span className="text-xs font-semibold text-cyan-400">EGP</span>
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Quantity</span>
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-1">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  id={`btn-qty-dec-${game.id}`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-white" id={`qty-val-${game.id}`}>
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= 10}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  id={`btn-qty-inc-${game.id}`}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Checkout Button & Total */}
          <button
            onClick={() => onCheckout(game.id, quantity, totalPrice)}
            className={`w-full relative flex items-center justify-between px-4 py-3 bg-gradient-to-r ${accentColorClass} rounded-xl font-bold text-white text-sm tracking-wide shadow-lg group-hover:brightness-110 active:scale-[0.98] transition-all duration-200 overflow-hidden`}
            id={`btn-checkout-${game.id}`}
          >
            {/* Gloss shine effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:animate-[shine_0.75s_ease-out-in] pointer-events-none"></div>
            
            <span className="flex items-center gap-1.5 font-bold">
              <ShoppingCart className="w-4 h-4" />
              Checkout
            </span>
            <span className="font-display font-extrabold text-base bg-black/20 px-2.5 py-0.5 rounded-lg border border-white/10">
              {totalPrice.toLocaleString()} EGP
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
