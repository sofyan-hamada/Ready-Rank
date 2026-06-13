'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { dbService, Order, GAMES_INITIAL } from '@/lib/db';
import { authService, UserSession } from '@/lib/auth';
import { ShoppingBag, Key, Clipboard, Check, RefreshCw, AlertTriangle, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TicketPanel from '@/components/TicketPanel';

export default function OrdersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentication inputs
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      loadOrders(user.email);
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const u = authService.getCurrentUser();
      setCurrentUser(u);
      if (u) {
        loadOrders(u.email);
      } else {
        setOrders([]);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const loadOrders = async (email: string) => {
    setLoading(true);
    try {
      const data = await dbService.getOrders(email);
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim()) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setLoggingIn(true);
    try {
      const session = await authService.signIn(email.trim());
      if (session) {
        setCurrentUser(session);
        await loadOrders(session.email);
      } else {
        setAuthError('Authentication failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred.');
    } finally {
      setLoggingIn(false);
    }
  };

  const getGameName = (id: string) => {
    return GAMES_INITIAL.find(g => g.id === id)?.name || id;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-white tracking-wide flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-cyan-400" />
              MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-glow-cyan">ORDERS</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">
              View your purchased ranked accounts and login credentials
            </p>
          </div>

          {currentUser && (
            <button
              onClick={() => loadOrders(currentUser.email)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition-all"
              title="Refresh Orders"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh list
            </button>
          )}
        </div>

        {/* NOT LOGGED IN SCREEN */}
        {!currentUser ? (
          <div className="max-w-md mx-auto bg-[#0b0c16]/50 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mt-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl"></div>
            
            <h2 className="font-display font-bold text-xl text-white mb-2 text-center">
              Access Your Purchased Accounts
            </h2>
            <p className="text-xs text-gray-400 text-center mb-6">
              Enter the email address you used during checkout to view your account details instantly.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div className="bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs p-3 rounded-lg">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="gamer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  id="orders-login-email"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn || !email}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-sm font-semibold text-white shadow-lg transition-all"
                id="btn-login-orders"
              >
                {loggingIn ? 'Accessing...' : 'View My Orders'}
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN SCREEN */
          <div className="space-y-6">
            {/* User Session Banner */}
            <div className="bg-cyan-950/10 border border-cyan-800/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs">
                <span className="text-gray-400">Logged in as:</span>{' '}
                <strong className="text-white text-sm font-bold ml-1">{currentUser.email}</strong>
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Order data is synchronized with Ready Rank database
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse h-40 bg-[#0b0c16]/30 border border-gray-900 rounded-2xl"></div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#0b0c16]/30 border border-gray-900 rounded-2xl p-12 text-center space-y-4">
                <p className="text-sm text-gray-400">
                  You haven&apos;t purchased any ranked accounts yet.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                  id="btn-go-shopping"
                >
                  Visit Storefront
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const hasManualDelivery = order.credentials_delivered.some(cred => cred === '');
                  const deliveredCount = order.credentials_delivered.filter(cred => cred !== '').length;

                  return (
                    <div 
                      key={order.id} 
                      className="bg-[#0b0c16]/30 border border-gray-900 rounded-2xl overflow-hidden shadow-lg hover:border-gray-800 transition-colors"
                      id={`order-card-${order.id}`}
                    >
                      {/* Order Header bar */}
                      <div className="bg-gray-950/50 border-b border-gray-900 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Order ID</span>
                          <span className="text-xs font-semibold text-gray-400 block font-mono" id={`order-id-${order.id}`}>
                            {order.id}
                          </span>
                        </div>
                        <div className="text-right sm:text-left">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Purchase Date</span>
                          <span className="text-xs text-gray-400 font-semibold" id={`order-date-${order.id}`}>
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#05050a] border border-gray-800 px-3 py-1.5 rounded-lg ml-auto sm:ml-0">
                          <span className="text-xs text-gray-400">Total:</span>
                          <span className="font-display font-extrabold text-sm text-cyan-400" id={`order-price-${order.id}`}>
                            {order.total_price.toLocaleString()} EGP
                          </span>
                        </div>
                      </div>

                      {/* Order Body Details */}
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-display font-bold text-lg text-white" id={`order-game-title-${order.id}`}>
                            {getGameName(order.game_id)}{' '}
                            <span className="text-xs font-medium text-gray-500">
                              (× {order.quantity} {order.quantity === 1 ? 'Account' : 'Accounts'})
                            </span>
                          </h3>

                          {hasManualDelivery && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/50 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Manual Delivery Pending
                            </span>
                          )}
                        </div>

                        {/* Delivered Credentials */}
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-violet-400" />
                            Allocated Account Credentials
                          </span>

                          <div className="grid grid-cols-1 gap-3">
                            {order.credentials_delivered.map((credentials, idx) => {
                              const uniqueKey = `${order.id}-cred-${idx}`;
                              
                              if (!credentials) {
                                return (
                                  <div 
                                    key={uniqueKey} 
                                    className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-amber-200"
                                    id={`pending-delivery-msg-${idx}`}
                                  >
                                    <div className="text-xs">
                                      <p className="font-bold flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        Manual Delivery Required for Account #{idx + 1}
                                      </p>
                                      <p className="text-amber-300/80 mt-0.5">
                                        We are preparing these credentials. We will contact you at <strong>{order.user_email}</strong> with details shortly.
                                      </p>
                                    </div>
                                    <span className="text-[10px] uppercase font-extrabold tracking-widest bg-amber-950 border border-amber-800 text-amber-400 px-2 py-0.5 rounded">
                                      Pending
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div 
                                  key={uniqueKey} 
                                  className="bg-gray-950 border border-gray-900 rounded-xl p-4 flex justify-between items-center gap-4 hover:border-gray-800/80 transition-colors"
                                  id={`credentials-box-${idx}`}
                                >
                                  <div className="flex-grow space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-violet-400">
                                      Account #{idx + 1}
                                    </div>
                                    <code className="text-xs text-gray-200 font-mono block select-all bg-gray-900/50 p-2 rounded border border-gray-900/80 overflow-x-auto whitespace-pre-wrap max-w-full" id={`credentials-text-${idx}`}>
                                      {credentials}
                                    </code>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleCopy(credentials, uniqueKey)}
                                    className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all shadow-md shrink-0 self-end"
                                    title="Copy Credentials"
                                    id={`btn-copy-${uniqueKey}`}
                                  >
                                    {copiedId === uniqueKey ? (
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Clipboard className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Support Tickets Section — shown only when logged in */}
        {currentUser && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-5">
              <Headphones className="w-5 h-5 text-violet-400" />
              <h2 className="font-display font-bold text-lg text-white">Your Support Tickets</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              A ticket is automatically opened for every order. Use it to contact the admin if you need help.
            </p>
            <TicketPanel userEmail={currentUser.email} isAdmin={false} />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
