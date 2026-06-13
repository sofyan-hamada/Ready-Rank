'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TicketPanel from '@/components/TicketPanel';
import { dbService, GAMES_INITIAL, Order } from '@/lib/db';
import { authService, UserSession } from '@/lib/auth';
import { AlertTriangle, Clock, CreditCard, MessageCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
      const nextUser = authService.getCurrentUser();
      setCurrentUser(nextUser);
      if (nextUser) {
        loadOrders(nextUser.email);
      } else {
        setOrders([]);
        setLoading(false);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const loadOrders = async (buyerEmail: string) => {
    setLoading(true);
    try {
      const data = await dbService.getOrders(buyerEmail);
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
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoggingIn(false);
    }
  };

  const getGameName = (id: string) => {
    return GAMES_INITIAL.find(game => game.id === id)?.name || id;
  };

  return (
    <>
      <Navbar />

      <main className="mx-auto flex-grow w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display flex items-center gap-2 text-3xl font-extrabold tracking-wide text-white">
              <ShoppingBag className="h-8 w-8 text-cyan-400" />
              MY <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent text-glow-cyan">ORDERS</span>
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Order history with each ticket directly inside its order
            </p>
          </div>

          {currentUser && (
            <button
              onClick={() => loadOrders(currentUser.email)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-all hover:bg-gray-900 hover:text-white"
              title="Refresh Orders"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh list
            </button>
          )}
        </div>

        {!currentUser ? (
          <div className="relative mx-auto mt-10 max-w-md overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0c16]/50 p-6 shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-600/5 blur-2xl" />

            <h2 className="mb-2 text-center font-display text-xl font-bold text-white">
              Access Your Orders
            </h2>
            <p className="mb-6 text-center text-xs text-gray-400">
              Enter the email address you used during checkout to view your order tickets.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div className="rounded-lg border border-rose-800/50 bg-rose-950/30 p-3 text-xs text-rose-300">
                  {authError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="gamer@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3.5 py-2 text-sm text-white transition-colors focus:border-cyan-500 focus:outline-none"
                  id="orders-login-email"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn || !email}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-500 hover:to-violet-500 disabled:opacity-40"
                id="btn-login-orders"
              >
                {loggingIn ? 'Accessing...' : 'View My Orders'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-xl border border-cyan-800/20 bg-cyan-950/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                <span className="text-gray-400">Logged in as:</span>{' '}
                <strong className="ml-1 text-sm font-bold text-white">{currentUser.email}</strong>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Start with the ticket inside each order card
              </div>
            </div>

            {loading ? (
              <div className="space-y-5">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-900 bg-[#0b0c16]/30" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="space-y-4 rounded-2xl border border-gray-900 bg-[#0b0c16]/30 p-12 text-center">
                <p className="text-sm text-gray-400">
                  You haven&apos;t placed any orders yet.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110"
                  id="btn-go-shopping"
                >
                  Visit Storefront
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-gray-900 bg-[#0b0c16]/40 shadow-lg transition-colors hover:border-gray-800"
                    id={`order-card-${order.id}`}
                  >
                    <div className="border-b border-gray-900 bg-gray-950/50 px-5 py-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/50 bg-amber-950/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Waiting Admin Reply
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-900/50 bg-violet-950/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-300">
                              <MessageCircle className="h-3.5 w-3.5" />
                              Ticket Inside
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-bold text-white" id={`order-game-title-${order.id}`}>
                            {getGameName(order.game_id)}
                            <span className="ml-2 text-xs font-medium text-gray-500">
                              x {order.quantity} {order.quantity === 1 ? 'Account' : 'Accounts'}
                            </span>
                          </h3>
                          <span className="mt-1 block truncate text-[11px] font-semibold text-gray-500" id={`order-id-${order.id}`}>
                            Order #{order.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                          <div className="rounded-lg border border-gray-800 bg-[#05050a] px-3 py-2">
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500">
                              <Clock className="h-3 w-3" />
                              Date
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-gray-300" id={`order-date-${order.id}`}>
                              {new Date(order.created_at).toLocaleDateString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/10 px-3 py-2">
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-cyan-500">
                              <CreditCard className="h-3 w-3" />
                              Total
                            </span>
                            <span className="mt-1 block font-display text-sm font-extrabold text-cyan-300" id={`order-price-${order.id}`}>
                              {order.total_price.toLocaleString()} EGP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.25fr)]">
                      <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4 text-amber-200">
                        <p className="flex items-center gap-1.5 text-xs font-bold">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Delivery happens in this order ticket
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-amber-300/80">
                          Follow up with the admin here, send missing details, and attach screenshots when needed. No account credentials are displayed publicly on this page.
                        </p>
                      </div>

                      <div id={`order-ticket-${order.id}`}>
                        <TicketPanel userEmail={currentUser.email} isAdmin={false} orderId={order.id} embedded />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
