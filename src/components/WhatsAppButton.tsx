'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  // Configured WhatsApp number (Egypt country code 20 + number). Can be overridden via env.
  const whatsappNumber = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '201021469145'; 
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً Ready Rank، أود الاستفسار عن شراء حساب...')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 group"
      aria-label="Contact us on WhatsApp"
      id="whatsapp-float-btn"
    >
      <MessageCircle className="w-7 h-7 fill-white/10" />
      
      {/* Tooltip */}
      <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-right bg-[#0b0c16] border border-gray-800 text-gray-200 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
        تواصل معنا / Contact Us
      </span>
    </a>
  );
}
