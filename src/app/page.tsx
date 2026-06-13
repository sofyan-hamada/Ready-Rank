'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import ReviewSection from '@/components/ReviewSection';
import { dbService, GamePrice, Order } from '@/lib/db';
import { authService, UserSession } from '@/lib/auth';
import { ShieldCheck, Zap, Award, Sparkles, X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [games, setGames] = useState<GamePrice[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // Checkout flow state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GamePrice | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedTotal, setSelectedTotal] = useState(0);
  
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    loadGames();
    setCurrentUser(authService.getCurrentUser());

    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };

    window.addEventListener('auth-change', handleAuthChange);
    // Reload prices when storage changes (e.g., admin edits price in another window)
    window.addEventListener('storage', loadGames);
    window.addEventListener('inventory-change', loadGames);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', loadGames);
      window.removeEventListener('inventory-change', loadGames);
    };
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const [pricesData, stockData] = await Promise.all([
        dbService.getPrices(),
        dbService.getStockCounts(),
      ]);
      setGames(pricesData);
      setStockCounts(stockData);
    } catch (err) {
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = (gameId: string, quantity: number, totalPrice: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    setSelectedGame(game);
    setSelectedQty(quantity);
    setSelectedTotal(totalPrice);
    setCheckoutError('');
    setOrderSuccess(null);

    const user = authService.getCurrentUser();
    if (user) {
      // If already logged in, skip auth step and show purchase confirmation directly
      setCheckoutEmail(user.email);
    } else {
      setCheckoutEmail('');
    }

    setCheckoutModalOpen(true);
  };

  const executeOrder = async (emailToUse: string) => {
    if (!selectedGame) return;
    setSubmittingOrder(true);
    setCheckoutError('');

    try {
      // 1. If not logged in, sign in/sign up the user first
      const activeUser = authService.getCurrentUser();
      if (!activeUser) {
        const session = await authService.signIn(emailToUse);
        if (!session) {
          setCheckoutError('Could not authenticate. Please try again.');
          setSubmittingOrder(false);
          return;
        }
      }

      // 2. Place order
      const order = await dbService.placeOrder(emailToUse, selectedGame.id, selectedQty, selectedTotal);
      if (order) {
        setOrderSuccess(order);
        loadGames();
      } else {
        setCheckoutError('Failed to place order. Please try again.');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'An error occurred during checkout.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmail.trim()) {
      setCheckoutError('Please enter a valid email address.');
      return;
    }
    await executeOrder(checkoutEmail.trim());
  };

  const getStockCount = (gameId: string) => {
    return stockCounts[gameId] || 0;
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#05050a] to-[#05050a]" id="hero-section">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-violet-900/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-300 text-xs font-semibold tracking-wider uppercase mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Ticket-Based Manual Fulfillment
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-tight">
              SKIP THE GRIND.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 text-glow-purple">
                RANK UP INSTANTLY.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 mt-6 leading-relaxed">
              Choose your game, place an order, and a support ticket opens automatically so the admin can prepare and deliver your account manually.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a 
                href="#games-grid" 
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                id="hero-cta-browse"
              >
                Browse Accounts
              </a>
              <a 
                href="#reviews-section" 
                className="px-6 py-3 bg-gray-900/80 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/40 rounded-xl font-bold text-sm tracking-wide transition-all"
                id="hero-cta-reviews"
              >
                Read Reviews
              </a>
            </div>

            {/* Features Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 border-t border-gray-900/60">
              <div className="flex items-center gap-3 justify-center sm:justify-start bg-gray-950/30 border border-gray-900 rounded-xl p-4">
                <div className="p-2.5 bg-violet-950/50 border border-violet-800/30 rounded-lg text-violet-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-extrabold text-white leading-none">Ticket First</p>
                  <p className="text-xs text-gray-500 mt-0.5">Every order opens a support thread</p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start bg-gray-950/30 border border-gray-900 rounded-xl p-4">
                <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/30 rounded-lg text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-extrabold text-white leading-none">Safe & Secure</p>
                  <p className="text-xs text-gray-500 mt-0.5">No public credential exposure</p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start bg-gray-950/30 border border-gray-900 rounded-xl p-4">
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/30 rounded-lg text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-extrabold text-white leading-none">4.9 / 5.0 Rating</p>
                  <p className="text-xs text-gray-500 mt-0.5">Trusted by thousands of gamers</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Storefront Grid Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16" id="games-grid">
          <div className="text-center md:text-left mb-10">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-wide">
              READY-TO-PLAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">INVENTORY</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">
              Select your game and quantities to check out
            </p>
          </div>

          {loading && games.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-[400px] rounded-2xl bg-[#0b0c16]/30 border border-gray-900"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  stockCount={getStockCount(game.id)}
                  onCheckout={handleCheckoutClick} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <ReviewSection />
      </main>

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0b0c16] border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden shadow-glow-cyan">
            {/* Background blur decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-600/5 rounded-full blur-3xl -z-10"></div>
            
            {/* Close Button */}
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-colors"
              id="btn-close-checkout"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderSuccess ? (
              <>
                <h3 className="font-display font-bold text-xl text-white mb-4">
                  Checkout Confirmation
                </h3>

                {/* Order Summary Card */}
                <div className="bg-gray-950/60 border border-gray-900 rounded-xl p-4 mb-5 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Game Account:</span>
                    <span className="text-white font-bold">{selectedGame.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Quantity:</span>
                    <span className="text-white font-bold">× {selectedQty}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-900 pt-2.5">
                    <span className="text-gray-400 font-medium">Total Price:</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-extrabold text-base">
                      {selectedTotal.toLocaleString()} EGP
                    </span>
                  </div>
                </div>

                <form onSubmit={handleModalSubmit} className="space-y-4">
                  {checkoutError && (
                    <div className="bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs p-3 rounded-lg">
                      {checkoutError}
                    </div>
                  )}

                  {!currentUser && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        Enter your email to create the order and open a support ticket with the admin.
                      </p>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="gamer@example.com"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        id="checkout-email-input"
                      />
                    </div>
                  )}

                  {currentUser && (
                    <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-3 text-xs text-cyan-300">
                      Purchasing as logged-in user: <strong>{currentUser.email}</strong>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingOrder || (!currentUser && !checkoutEmail)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 disabled:opacity-40 disabled:pointer-events-none font-bold text-white text-sm tracking-wide shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-200"
                    id="btn-confirm-purchase"
                  >
                    {submittingOrder ? 'Processing...' : 'Confirm & Buy Now'}
                  </button>
                </form>
              </>
            ) : (
              // Order Success Message
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                
                <h3 className="font-display font-extrabold text-2xl text-white tracking-wide">
                  PURCHASE SUCCESSFUL!
                </h3>
                
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                  Your order for <strong className="text-white">{selectedQty} × {selectedGame.name}</strong> accounts has been registered.
                </p>

                <div className="bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs p-3 rounded-lg text-left">
                  Your ticket is open. The admin has been notified and will continue delivery with you in the order ticket.
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href="/orders"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-lg text-xs font-bold text-white shadow-md transition-all"
                    id="btn-goto-orders"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Go to My Orders
                  </Link>
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-full py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all"
                    id="btn-continue-shopping"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
