import React from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#030307] border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 group mb-3">
              <div className="p-1.5 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-lg">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                READY RANK
              </span>
            </Link>
            <p className="text-xs text-gray-500 max-w-sm">
              Ready Rank orders are fulfilled through support tickets so the admin can prepare and deliver each account manually.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Storefront
            </Link>
            <Link href="/orders" className="hover:text-cyan-400 transition-colors">
              My Orders
            </Link>
            <Link href="/admin" className="hover:text-violet-400 transition-colors">
              Admin Area
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} Ready Rank. All rights reserved.</p>
            <p className="text-[10px] text-gray-700 mt-1">Made for ranked gamers.</p>
          </div>

        </div>
      </div>
    </footer>
  );
}
