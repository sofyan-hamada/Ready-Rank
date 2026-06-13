'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth';
import { dbService } from '@/lib/db';
import { LogIn, LogOut, Shield, User, X, Gamepad2, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSupabase, setIsSupabase] = useState(true);

  // Sync auth status
  useEffect(() => {
    setUser(authService.getCurrentUser());
    setIsSupabase(dbService.isSupabase());

    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email) {
      setAuthError('Please enter an email.');
      return;
    }
    
    try {
      const session = await authService.signIn(email, password);
      if (session) {
        setUser(session);
        setIsLoginOpen(false);
        setEmail('');
        setPassword('');
        
        // Redirect to admin if logging in as admin
        if (session.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/orders');
        }
      } else {
        setAuthError('Authentication failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during sign in.');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <>
      {/* Offline Demo Warning Banner */}
      {!isSupabase && (
        <div className="bg-gradient-to-r from-amber-950 to-orange-950 border-b border-orange-500/20 text-orange-200 text-xs py-1 px-4 text-center font-medium flex justify-center items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
          Running in offline-first mode (using localStorage). Provide Supabase credentials in .env.local to persist data.
        </div>
      )}

      <nav className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#05050a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="p-2 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-lg group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 group-hover:brightness-110 transition-all duration-300">
                  READY RANK
                </span>
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-6 items-center">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
                  pathname === '/' ? 'text-cyan-400 font-semibold' : 'text-gray-300'
                }`}
              >
                Storefront
              </Link>
              {user && (
                <Link
                  href="/orders"
                  className={`text-sm font-medium transition-colors hover:text-cyan-400 flex items-center gap-1.5 ${
                    pathname === '/orders' ? 'text-cyan-400 font-semibold' : 'text-gray-300'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  My Orders
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition-colors hover:text-violet-400 flex items-center gap-1.5 ${
                    pathname === '/admin' ? 'text-violet-400 font-semibold' : 'text-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
            </div>

            {/* Auth Panel */}
            <div className="flex items-center gap-4">
              {/* Mobile View Orders Link */}
              {user && (
                <Link
                  href="/orders"
                  className="md:hidden p-2 text-gray-300 hover:text-cyan-400 transition-colors"
                  title="My Orders"
                >
                  <ShoppingBag className="w-5 h-5" />
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="md:hidden p-2 text-gray-300 hover:text-violet-400 transition-colors"
                  title="Admin Dashboard"
                >
                  <Shield className="w-5 h-5" />
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      {user.email}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded mt-0.5 ${
                      user.role === 'admin' 
                        ? 'bg-violet-950 border border-violet-700/50 text-violet-300' 
                        : 'bg-cyan-950 border border-cyan-700/50 text-cyan-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 text-sm font-medium hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/50 transition-all duration-200"
                    id="btn-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-sm font-semibold text-white shadow-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  id="btn-open-login"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0b0c16] border border-gray-800 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] shadow-glow-purple overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="font-display font-bold text-2xl text-white tracking-wide">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Ready Rank</span>
              </h2>
              <button
                onClick={() => setIsLoginOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-colors"
                id="btn-close-login"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              {authError && (
                <div className="bg-rose-950/30 border border-rose-800/50 text-rose-300 text-sm p-3 rounded-lg">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    id="input-login-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-1.5 flex justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-gray-500 lowercase normal-case font-normal">
                    (Optional for mock)
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-lg py-2 px-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  id="input-login-password"
                />
              </div>

              <div className="text-xs text-gray-400 space-y-1 bg-gray-950/40 p-2.5 border border-gray-900 rounded-lg">
                <p>💡 **Quick Login Options:**</p>
                <p>• Admin: <code className="text-violet-400 bg-violet-950/40 px-1 py-0.5 rounded">admin@readyrank.com</code></p>
                <p>• Buyer: Enter any other email address</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-sm font-semibold text-white py-2.5 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200"
                id="btn-login-submit"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
