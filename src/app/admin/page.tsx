'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { dbService, GamePrice, InventoryItem, Order, Review, GAMES_INITIAL } from '@/lib/db';
import { authService, UserSession } from '@/lib/auth';
import TicketPanel from '@/components/TicketPanel';
import { 
  Shield, DollarSign, List, Bell, MessageSquare, PlusCircle, Trash2, 
  Database, RefreshCw, Key, ShieldAlert, Award, ShoppingCart, UserCheck, X, Headphones
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'prices' | 'inventory' | 'orders' | 'reviews' | 'support'>('orders');
  
  // Data lists
  const [games, setGames] = useState<GamePrice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [updatingPrice, setUpdatingPrice] = useState<string | null>(null);
  
  // Forms state
  const [pricesInput, setPricesInput] = useState<{ [key: string]: number }>({});
  const [descriptionsInput, setDescriptionsInput] = useState<{ [key: string]: string }>({});
  
  const [inventoryGameId, setInventoryGameId] = useState('marvel-rivals');
  const [inventoryCredentials, setInventoryCredentials] = useState('');
  const [submittingInventory, setSubmittingInventory] = useState(false);

  // Auth form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Sound & Live Alert State
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    if (user?.role === 'admin') {
      loadAllData();
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const u = authService.getCurrentUser();
      setCurrentUser(u);
      if (u?.role === 'admin') {
        loadAllData();
      }
    };

    // Live order listener (Web Storage Custom Event)
    const handleNewOrder = (e: any) => {
      const order = e.detail as Order;
      // Play a cool synth notify sound using Web Audio API
      playNotificationSound();
      setNewOrderAlert(order);
      // Automatically refresh orders
      loadAllOrders();
      loadAllInventory();
      // Dismiss alert after 6 seconds
      setTimeout(() => setNewOrderAlert(null), 6000);
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('new-order', handleNewOrder);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('new-order', handleNewOrder);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadGames(),
      loadAllInventory(),
      loadAllOrders(),
      loadAllReviews(),
    ]);
    setLoading(false);
  };

  const loadGames = async () => {
    try {
      const data = await dbService.getPrices();
      setGames(data);
      // Seed prices inputs
      const initialPrices: { [key: string]: number } = {};
      const initialDescriptions: { [key: string]: string } = {};
      data.forEach(g => {
        initialPrices[g.id] = g.price_egp;
        initialDescriptions[g.id] = g.description || '';
      });
      setPricesInput(initialPrices);
      setDescriptionsInput(initialDescriptions);
    } catch (err) {
      console.error('Error loading games:', err);
    }
  };

  const loadAllInventory = async () => {
    try {
      const data = await dbService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  };

  const loadAllOrders = async () => {
    try {
      // Pass admin email to fetch all orders
      const data = await dbService.getOrders('admin@readyrank.com');
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadAllReviews = async () => {
    try {
      const data = await dbService.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!adminEmail.trim()) {
      setAuthError('Please enter email.');
      return;
    }

    setLoggingIn(true);
    try {
      const session = await authService.signIn(adminEmail.trim(), adminPassword);
      if (session && session.role === 'admin') {
        setCurrentUser(session);
        await loadAllData();
      } else {
        setAuthError('Access denied. Only administrators can enter.');
        authService.signOut(); // reset if standard user
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUpdatePrice = async (gameId: string) => {
    const newPrice = pricesInput[gameId];
    const newDescription = descriptionsInput[gameId] || '';
    if (newPrice === undefined || newPrice < 0) return;

    setUpdatingPrice(gameId);
    try {
      const success = await dbService.updatePrice(gameId, newPrice, newDescription);
      if (success) {
        await loadGames();
      }
    } catch (err) {
      console.error('Error updating price:', err);
    } finally {
      setUpdatingPrice(null);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryCredentials.trim()) return;

    setSubmittingInventory(true);
    try {
      const success = await dbService.addInventory(inventoryGameId, inventoryCredentials.trim());
      if (success) {
        setInventoryCredentials('');
        await loadAllInventory();
      }
    } catch (err) {
      console.error('Error adding inventory:', err);
    } finally {
      setSubmittingInventory(false);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory credentials?')) return;
    try {
      const success = await dbService.deleteInventory(id);
      if (success) {
        await loadAllInventory();
      }
    } catch (err) {
      console.error('Error deleting inventory:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const success = await dbService.deleteReview(id);
      if (success) {
        await loadAllReviews();
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  // Synthesize notification chime using Web Audio API
  const playNotificationSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Node 1: Oscillator (Freq Pitch)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.warn('Could not synthesize sound:', err);
    }
  };

  const getGameName = (id: string) => {
    return GAMES_INITIAL.find(g => g.id === id)?.name || id;
  };

  const getStockCount = (gameId: string) => {
    return inventory.filter(item => item.game_id === gameId && !item.is_sold).length;
  };

  const getSoldCount = (gameId: string) => {
    return inventory.filter(item => item.game_id === gameId && item.is_sold).length;
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full">
        
        {/* Live Order Alert Card */}
        {newOrderAlert && (
          <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-gradient-to-r from-violet-950 to-indigo-950 border border-violet-500 rounded-xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-bounce relative">
            <button
              onClick={() => setNewOrderAlert(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              <div className="p-2.5 bg-violet-600 rounded-lg text-white">
                <Bell className="w-5 h-5 animate-swing" />
              </div>
              <div>
                <p className="text-xs text-violet-400 uppercase font-bold tracking-wider">New Order Received!</p>
                <h4 className="font-bold text-sm text-white mt-0.5">
                  {newOrderAlert.quantity} × {getGameName(newOrderAlert.game_id)}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  Buyer: {newOrderAlert.user_email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NOT LOGGED IN ADMIN */}
        {!currentUser || currentUser.role !== 'admin' ? (
          <div className="max-w-md mx-auto bg-[#0b0c16]/50 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mt-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl"></div>
            
            <h2 className="font-display font-extrabold text-xl text-white mb-2 text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-violet-500" />
              ADMIN CONTROL PANEL
            </h2>
            <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-wider font-semibold">
              Authorized personnel only
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {authError && (
                <div className="bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs p-3 rounded-lg">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@readyrank.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-3.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  id="admin-login-email"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                  Security Passphrase / Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-3.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  id="admin-login-password"
                />
              </div>



              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg transition-all"
                id="btn-login-admin"
              >
                {loggingIn ? 'Verifying...' : 'Access Command Center'}
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN ADMIN DASHBOARD */
          <div className="space-y-8">
            
            {/* Admin Header Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-900 pb-6">
              <div>
                <h1 className="font-display font-extrabold text-3xl text-white tracking-wide flex items-center gap-2">
                  <Shield className="w-8 h-8 text-violet-500" />
                  ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-glow-purple">DASHBOARD</span>
                </h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">
                  Manage Prices, Credentials Inventory, Incoming Orders, and Reviews
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadAllData}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
                  title="Reload dashboard data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Data
                </button>
              </div>
            </div>

            {/* Dashboard Quick Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-violet-950 border border-violet-800/40 rounded-lg text-violet-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Total Orders</span>
                  <span className="text-xl font-extrabold text-white leading-none">{orders.length}</span>
                </div>
              </div>

              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-cyan-950 border border-cyan-800/40 rounded-lg text-cyan-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Gross Revenue</span>
                  <span className="text-xl font-extrabold text-white leading-none">
                    {orders.reduce((acc, c) => acc + c.total_price, 0).toLocaleString()} EGP
                  </span>
                </div>
              </div>

              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950 border border-emerald-800/40 rounded-lg text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">In Stock Accounts</span>
                  <span className="text-xl font-extrabold text-white leading-none">
                    {inventory.filter(i => !i.is_sold).length}
                  </span>
                </div>
              </div>

              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-amber-950 border border-amber-800/40 rounded-lg text-amber-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Total Reviews</span>
                  <span className="text-xl font-extrabold text-white leading-none">{reviews.length}</span>
                </div>
              </div>
            </div>

            {/* Main Section: Tab controls */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Sidebar Tabs */}
              <div className="lg:col-span-1 space-y-1.5">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === 'orders' 
                      ? 'bg-violet-950/40 border-violet-800 text-violet-300 shadow-glow-purple' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-950/50'
                  }`}
                  id="tab-orders"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Orders Log
                  </span>
                  {orders.length > 0 && (
                    <span className="bg-violet-600 text-white rounded-full px-2 py-0.5 text-[9px] font-extrabold font-mono">
                      {orders.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('prices')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === 'prices' 
                      ? 'bg-violet-950/40 border-violet-800 text-violet-300 shadow-glow-purple' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-950/50'
                  }`}
                  id="tab-prices"
                >
                  <DollarSign className="w-4 h-4" />
                  Price Control
                </button>

                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === 'inventory' 
                      ? 'bg-violet-950/40 border-violet-800 text-violet-300 shadow-glow-purple' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-950/50'
                  }`}
                  id="tab-inventory"
                >
                  <Key className="w-4 h-4" />
                  Inventory loader
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === 'reviews' 
                      ? 'bg-violet-950/40 border-violet-800 text-violet-300 shadow-glow-purple' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-950/50'
                  }`}
                  id="tab-reviews"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reviews Mod
                </button>

                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === 'support' 
                      ? 'bg-violet-950/40 border-violet-800 text-violet-300 shadow-glow-purple' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-950/50'
                  }`}
                  id="tab-support"
                >
                  <Headphones className="w-4 h-4" />
                  Support
                </button>
              </div>

              {/* Tab Display Panel */}
              <div className="lg:col-span-4 bg-[#0b0c16]/30 border border-gray-900 rounded-2xl p-6 shadow-xl relative min-h-[400px]">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-xs rounded-2xl">
                    <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                  </div>
                ) : null}

                {/* TAB 1: ORDERS LOG */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                      <h3 className="font-display font-bold text-lg text-white">INCOMING ORDER NOTIFICATIONS</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total: {orders.length}</span>
                    </div>

                    {orders.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-12">No orders placed yet. Storefront checkouts appear here live.</p>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {orders.map((order) => {
                          const isManualPending = order.credentials_delivered.some(c => c === '');
                          return (
                            <div 
                              key={order.id} 
                              className="bg-gray-950/60 border border-gray-900 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 hover:border-gray-800 transition-colors"
                              id={`admin-order-card-${order.id}`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-extrabold text-white uppercase tracking-wider" id={`admin-order-game-${order.id}`}>
                                    {order.quantity} × {getGameName(order.game_id)}
                                  </span>
                                  {isManualPending && (
                                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/50 text-amber-300">
                                      Manual Delivery Pending
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Customer: <strong className="text-cyan-400 font-bold font-mono" id={`admin-order-buyer-${order.id}`}>{order.user_email}</strong>
                                </div>
                                <div className="text-[10px] text-gray-600 font-mono">
                                  ID: {order.id} • {new Date(order.created_at).toLocaleString()}
                                </div>
                              </div>

                              <div className="flex flex-col sm:items-end justify-between text-right gap-2 shrink-0">
                                <span className="font-display font-extrabold text-sm text-cyan-400">
                                  {order.total_price.toLocaleString()} EGP
                                </span>
                                
                                <span className="text-[10px] text-gray-500 bg-gray-900/50 px-2.5 py-1 rounded border border-gray-900">
                                  {order.credentials_delivered.filter(c => c !== '').length} / {order.quantity} Creds Assigned
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PRICE CONTROL */}
                {activeTab === 'prices' && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-900 pb-3">
                      <h3 className="font-display font-bold text-lg text-white">PRICE & DESCRIPTION SETTINGS</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                        Edit the price in Egyptian Pounds and description for any game card instantly
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {games.map((game) => (
                        <div 
                          key={game.id} 
                          className="bg-gray-950/60 border border-gray-900 rounded-xl p-5 space-y-4 flex flex-col justify-between"
                          id={`price-edit-row-${game.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-bold text-white block">{game.name}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                Current: {game.price_egp} EGP
                              </span>
                            </div>
                            <button
                              onClick={() => handleUpdatePrice(game.id)}
                              disabled={updatingPrice === game.id}
                              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-bold text-white shadow-md transition-colors"
                              id={`btn-save-price-${game.id}`}
                            >
                              {updatingPrice === game.id ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">
                                Price (EGP)
                              </label>
                              <input
                                type="number"
                                required
                                value={pricesInput[game.id] !== undefined ? pricesInput[game.id] : ''}
                                onChange={(e) => setPricesInput({
                                  ...pricesInput,
                                  [game.id]: parseFloat(e.target.value) || 0
                                })}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                                id={`input-price-${game.id}`}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">
                                Description
                              </label>
                              <textarea
                                required
                                rows={2}
                                value={descriptionsInput[game.id] !== undefined ? descriptionsInput[game.id] : ''}
                                onChange={(e) => setDescriptionsInput({
                                  ...descriptionsInput,
                                  [game.id]: e.target.value
                                })}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-violet-500 resize-none transition-colors"
                                id={`input-desc-${game.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: INVENTORY LOADER */}
                {activeTab === 'inventory' && (
                  <div className="space-y-8">
                    <div className="border-b border-gray-900 pb-3">
                      <h3 className="font-display font-bold text-lg text-white">ACCOUNT CREDENTIALS INVENTORY</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                        Pre-load credentials to be automatically delivered to buyers on checkout
                      </p>
                    </div>

                    {/* Stock Overview Table */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {GAMES_INITIAL.map(g => {
                        const count = getStockCount(g.id);
                        return (
                          <div key={g.id} className="bg-gray-950/60 border border-gray-900 rounded-lg p-2.5 text-center">
                            <span className="text-[9px] text-gray-500 font-bold uppercase truncate block mb-1">{g.name}</span>
                            <span className={`text-sm font-extrabold ${count > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {count} In Stock
                            </span>
                            <span className="text-[9px] text-gray-600 block mt-0.5">({getSoldCount(g.id)} sold)</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Credentials Form */}
                    <form onSubmit={handleAddInventory} className="bg-gray-950/60 border border-gray-900 rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PlusCircle className="w-4 h-4 text-violet-400" />
                        <h4 className="font-bold text-sm text-white">Load New Credentials</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                            Select Game
                          </label>
                          <select
                            value={inventoryGameId}
                            onChange={(e) => setInventoryGameId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
                            id="select-inventory-game"
                          >
                            {GAMES_INITIAL.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5 flex justify-between">
                            <span>Account Login Credentials</span>
                            <span className="text-[9px] text-gray-500">e.g. login:pass or instructions</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="username:password (or instructions string)"
                            value={inventoryCredentials}
                            onChange={(e) => setInventoryCredentials(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3.5 text-white text-xs focus:outline-none focus:border-violet-500"
                            id="input-inventory-creds"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingInventory || !inventoryCredentials}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white rounded-lg shadow-md disabled:opacity-40"
                        id="btn-add-inventory"
                      >
                        {submittingInventory ? 'Adding...' : 'Load to Stock'}
                      </button>
                    </form>

                    {/* Inventory Items List */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-white">Loaded Inventory Records</h4>
                      
                      {inventory.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-6">No credentials loaded yet.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                          {inventory.map((item) => (
                            <div 
                              key={item.id} 
                              className="bg-gray-950/30 border border-gray-900 rounded-lg p-3 flex justify-between items-center gap-4 text-xs"
                              id={`inventory-row-${item.id}`}
                            >
                              <div className="space-y-1 overflow-hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-300">{getGameName(item.game_id)}</span>
                                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    item.is_sold 
                                      ? 'bg-rose-950/20 border border-rose-900/50 text-rose-400' 
                                      : 'bg-emerald-950/20 border border-emerald-900/50 text-emerald-400'
                                  }`}>
                                    {item.is_sold ? 'Sold' : 'In Stock'}
                                  </span>
                                </div>
                                <code className="text-[11px] text-gray-400 font-mono block truncate max-w-md" id={`inventory-creds-text-${item.id}`}>
                                  {item.credentials_text}
                                </code>
                                {item.purchased_by_email && (
                                  <div className="text-[10px] text-gray-600">
                                    Buyer: {item.purchased_by_email} (Order: {item.order_id})
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteInventory(item.id)}
                                className="p-2 bg-gray-900 border border-gray-800 text-gray-500 hover:text-rose-400 hover:border-rose-900/50 rounded-lg transition-colors shrink-0"
                                title="Delete Record"
                                id={`btn-delete-inv-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 4: REVIEWS MODERATION */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                      <h3 className="font-display font-bold text-lg text-white">REVIEWS MODERATOR PANEL</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total: {reviews.length}</span>
                    </div>

                    {reviews.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-12">No reviews submitted yet.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                        {reviews.map((rev) => (
                          <div 
                            key={rev.id} 
                            className="bg-gray-950/60 border border-gray-900 rounded-xl p-4 flex justify-between items-start gap-4 hover:border-gray-800 transition-colors"
                            id={`admin-review-row-${rev.id}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-cyan-400">{rev.user_name}</span>
                                <span className="text-[10px] text-gray-600">{new Date(rev.created_at).toLocaleString()}</span>
                              </div>
                              
                              {/* Rating display */}
                              <div className="flex text-yellow-400 text-xs">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < rev.rating ? 'text-yellow-400' : 'text-gray-700'}>★</span>
                                ))}
                              </div>

                              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{rev.comment}</p>
                            </div>

                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="p-2 bg-gray-900 border border-gray-800 text-gray-500 hover:text-rose-400 hover:border-rose-900/50 rounded-lg transition-colors shrink-0"
                              title="Delete Review"
                              id={`btn-delete-review-${rev.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: SUPPORT TICKETS */}
                {activeTab === 'support' && currentUser && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                      <h3 className="font-display font-bold text-lg text-white">CUSTOMER SUPPORT TICKETS</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">All Tickets</span>
                    </div>
                    <TicketPanel userEmail={currentUser.email} isAdmin={true} />
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </>
  );
}
