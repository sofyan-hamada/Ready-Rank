'use client';

import React, { useState, useEffect, useRef } from 'react';
import { dbService, SupportTicket, TicketMessage } from '@/lib/db';
import { Send, CheckCircle, MessageCircle, ChevronDown, ChevronUp, User, Shield } from 'lucide-react';

interface TicketPanelProps {
  userEmail: string;
  isAdmin: boolean;
}

export default function TicketPanel({ userEmail, isAdmin }: TicketPanelProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messageInputs, setMessageInputs] = useState<{ [ticketId: string]: string }>({});
  const [sending, setSending] = useState<string | null>(null);
  const bottomRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadTickets();

    const handleNewMsg = () => loadTickets();
    window.addEventListener('ticket-message', handleNewMsg);
    return () => window.removeEventListener('ticket-message', handleNewMsg);
  }, [userEmail]);

  // Auto-scroll to bottom when a ticket is expanded or new messages arrive
  useEffect(() => {
    if (expandedId && bottomRefs.current[expandedId]) {
      bottomRefs.current[expandedId]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expandedId, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTickets(userEmail);
      setTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (ticketId: string) => {
    const body = (messageInputs[ticketId] || '').trim();
    if (!body) return;
    setSending(ticketId);
    try {
      const sender = isAdmin ? 'admin' : 'buyer';
      await dbService.sendTicketMessage(ticketId, sender, body);
      setMessageInputs(prev => ({ ...prev, [ticketId]: '' }));
      await loadTickets();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    await dbService.closeTicket(ticketId);
    await loadTickets();
  };

  const handleKeyDown = (e: React.KeyboardEvent, ticketId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(ticketId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-950/40 border border-gray-900" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No support tickets yet.</p>
        {!isAdmin && <p className="text-xs mt-1 text-gray-600">A ticket is automatically created when you place an order.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map(ticket => {
        const isExpanded = expandedId === ticket.id;
        const unreadCount = (ticket.messages || []).filter(
          m => isAdmin ? m.sender === 'buyer' : m.sender === 'admin'
        ).length;

        return (
          <div
            key={ticket.id}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${
              ticket.status === 'closed'
                ? 'border-gray-900 opacity-70'
                : isExpanded
                ? 'border-violet-700/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                : 'border-gray-800 hover:border-gray-700'
            }`}
            id={`ticket-${ticket.id}`}
          >
            {/* Ticket Header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-950/50 text-left hover:bg-gray-950/70 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`shrink-0 p-1.5 rounded-lg ${ticket.status === 'open' ? 'bg-violet-950 text-violet-400' : 'bg-gray-900 text-gray-600'}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{ticket.subject}</p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">
                    {isAdmin ? ticket.buyer_email : `Order #${ticket.order_id.slice(0, 8)}`}
                    {' • '}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full border ${
                  ticket.status === 'open'
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
                    : 'bg-gray-900 border-gray-800 text-gray-600'
                }`}>
                  {ticket.status}
                </span>
                {(ticket.messages || []).length > 0 && (
                  <span className="text-[9px] text-gray-500 font-mono">
                    {(ticket.messages || []).length} msg{(ticket.messages || []).length !== 1 ? 's' : ''}
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>

            {/* Chat Body */}
            {isExpanded && (
              <div className="bg-[#05050a]">
                {/* Messages */}
                <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
                  {(ticket.messages || []).length === 0 && (
                    <p className="text-center text-[11px] text-gray-600 py-4">No messages yet. Start the conversation!</p>
                  )}
                  {(ticket.messages || []).map(msg => {
                    const isMine = isAdmin ? msg.sender === 'admin' : msg.sender === 'buyer';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            msg.sender === 'admin'
                              ? 'bg-violet-900 text-violet-300'
                              : 'bg-cyan-900 text-cyan-300'
                          }`}>
                            {msg.sender === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </div>
                          {/* Bubble */}
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed shadow-md ${
                            isMine
                              ? 'bg-violet-700 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                          }`}>
                            <p>{msg.body}</p>
                            <p className={`text-[9px] mt-1 ${isMine ? 'text-violet-300' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={el => { bottomRefs.current[ticket.id] = el; }} />
                </div>

                {/* Input Area */}
                {ticket.status === 'open' ? (
                  <div className="px-4 pb-3 flex items-end gap-2 border-t border-gray-900 pt-3">
                    <textarea
                      rows={2}
                      placeholder={isAdmin ? 'Reply to customer...' : 'Type your message...'}
                      value={messageInputs[ticket.id] || ''}
                      onChange={e => setMessageInputs(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      onKeyDown={e => handleKeyDown(e, ticket.id)}
                      className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                      id={`ticket-input-${ticket.id}`}
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleSend(ticket.id)}
                        disabled={!messageInputs[ticket.id]?.trim() || sending === ticket.id}
                        className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg text-white transition-colors shadow-md"
                        title="Send (Enter)"
                        id={`btn-send-${ticket.id}`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleClose(ticket.id)}
                          className="p-2 bg-gray-800 hover:bg-emerald-900 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                          title="Mark as Closed"
                          id={`btn-close-ticket-${ticket.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pb-3 pt-3 border-t border-gray-900">
                    <p className="text-center text-[11px] text-gray-600">This ticket is closed.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
