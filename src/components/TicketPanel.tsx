'use client';

import React, { useState, useEffect, useRef } from 'react';
import { dbService, SupportTicket } from '@/lib/db';
import { Send, CheckCircle, MessageCircle, ChevronDown, ChevronUp, User, Shield, Paperclip, Image as ImageIcon, X } from 'lucide-react';

interface TicketPanelProps {
  userEmail: string;
  isAdmin: boolean;
  orderId?: string;
  embedded?: boolean;
  onTicketClosed?: () => void | Promise<void>;
}

type AttachmentDraft = {
  url: string;
  name: string;
  type: string;
};

export default function TicketPanel({ userEmail, isAdmin, orderId, embedded = false, onTicketClosed }: TicketPanelProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(embedded ? orderId || null : null);
  const [messageInputs, setMessageInputs] = useState<{ [ticketId: string]: string }>({});
  const [attachmentInputs, setAttachmentInputs] = useState<{ [ticketId: string]: AttachmentDraft | null }>({});
  const [fileErrors, setFileErrors] = useState<{ [ticketId: string]: string }>({});
  const [sending, setSending] = useState<string | null>(null);
  const bottomRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const fileInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

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
      const visibleTickets = orderId ? data.filter(ticket => ticket.order_id === orderId) : data;
      setTickets(visibleTickets);
      if (embedded && visibleTickets.length > 0) {
        setExpandedId(visibleTickets[0].id);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (ticketId: string) => {
    const body = (messageInputs[ticketId] || '').trim();
    const attachment = attachmentInputs[ticketId] || null;
    if (!body && !attachment) return;
    setSending(ticketId);
    try {
      const sender = isAdmin ? 'admin' : 'buyer';
      await dbService.sendTicketMessage(ticketId, sender, body, attachment);
      setMessageInputs(prev => ({ ...prev, [ticketId]: '' }));
      setAttachmentInputs(prev => ({ ...prev, [ticketId]: null }));
      setFileErrors(prev => ({ ...prev, [ticketId]: '' }));
      if (fileInputRefs.current[ticketId]) {
        fileInputRefs.current[ticketId]!.value = '';
      }
      await loadTickets();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(null);
    }
  };

  const handleAttachmentChange = (ticketId: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileErrors(prev => ({ ...prev, [ticketId]: 'Please attach an image screenshot only.' }));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [ticketId]: 'Screenshot is too large. Maximum size is 4 MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentInputs(prev => ({
        ...prev,
        [ticketId]: {
          url: String(reader.result),
          name: file.name,
          type: file.type,
        },
      }));
      setFileErrors(prev => ({ ...prev, [ticketId]: '' }));
    };
    reader.onerror = () => {
      setFileErrors(prev => ({ ...prev, [ticketId]: 'Could not read this screenshot. Try another image.' }));
    };
    reader.readAsDataURL(file);
  };

  const clearAttachment = (ticketId: string) => {
    setAttachmentInputs(prev => ({ ...prev, [ticketId]: null }));
    setFileErrors(prev => ({ ...prev, [ticketId]: '' }));
    if (fileInputRefs.current[ticketId]) {
      fileInputRefs.current[ticketId]!.value = '';
    }
  };

  const handleClose = async (ticketId: string) => {
    await dbService.closeTicket(ticketId);
    await onTicketClosed?.();
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
      <div className={`${embedded ? 'py-5' : 'py-12'} text-center text-gray-500 text-sm`}>
        <MessageCircle className={`${embedded ? 'w-8 h-8' : 'w-10 h-10'} mx-auto mb-3 opacity-30`} />
        <p>No support ticket found for this order yet.</p>
        {!isAdmin && <p className="text-xs mt-1 text-gray-600">Refresh in a moment if the order was just created.</p>}
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-3'}>
      {tickets.map(ticket => {
        const isExpanded = expandedId === ticket.id;
        const draftAttachment = attachmentInputs[ticket.id] || null;
        const canSend = Boolean((messageInputs[ticket.id] || '').trim() || draftAttachment);

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
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                embedded ? 'bg-violet-950/20 hover:bg-violet-950/30' : 'bg-gray-950/50 hover:bg-gray-950/70'
              }`}
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
                <div className={`${embedded ? 'max-h-80' : 'max-h-72'} overflow-y-auto px-4 py-3 space-y-3`}>
                  {(ticket.messages || []).length === 0 && (
                    <p className="text-center text-[11px] text-gray-600 py-4">No messages yet. Send details or attach a screenshot.</p>
                  )}
                  {(ticket.messages || []).map(msg => {
                    const isMine = isAdmin ? msg.sender === 'admin' : msg.sender === 'buyer';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[88%] ${isMine ? 'flex-row-reverse' : ''}`}>
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
                            {msg.body && <p>{msg.body}</p>}
                            {msg.attachment_url && (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 block overflow-hidden rounded-lg border border-white/10 bg-black/20"
                                title={msg.attachment_name || 'Open screenshot'}
                              >
                                <img
                                  src={msg.attachment_url}
                                  alt={msg.attachment_name || 'Ticket screenshot'}
                                  className="max-h-48 w-full object-contain"
                                />
                              </a>
                            )}
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
                  <div className="border-t border-gray-900 px-4 pb-3 pt-3">
                    {draftAttachment && (
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-cyan-900/40 bg-cyan-950/10 p-2">
                        <img src={draftAttachment.url} alt="Selected screenshot preview" className="h-12 w-16 rounded border border-cyan-900/40 object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-cyan-200">{draftAttachment.name}</p>
                          <p className="text-[10px] text-cyan-400/70">Screenshot ready to send</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearAttachment(ticket.id)}
                          className="rounded-lg border border-gray-800 bg-gray-950 p-1.5 text-gray-400 hover:text-white"
                          title="Remove screenshot"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {fileErrors[ticket.id] && (
                      <p className="mb-2 text-[11px] font-semibold text-rose-300">{fileErrors[ticket.id]}</p>
                    )}

                    <div className="flex items-end gap-2">
                      <textarea
                        rows={embedded ? 3 : 2}
                        placeholder={isAdmin ? 'Reply to customer...' : 'Type your message or attach a screenshot...'}
                        value={messageInputs[ticket.id] || ''}
                        onChange={e => setMessageInputs(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        onKeyDown={e => handleKeyDown(e, ticket.id)}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                        id={`ticket-input-${ticket.id}`}
                      />
                      <div className="flex flex-col gap-1.5">
                      <input
                        ref={el => { fileInputRefs.current[ticket.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleAttachmentChange(ticket.id, e.target.files?.[0])}
                        id={`ticket-attachment-${ticket.id}`}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[ticket.id]?.click()}
                        className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-300 transition-colors shadow-md"
                        title="Attach screenshot"
                        id={`btn-attach-${ticket.id}`}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSend(ticket.id)}
                        disabled={!canSend || sending === ticket.id}
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
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-600">
                      <ImageIcon className="h-3 w-3" />
                      Screenshots are supported as images up to 4 MB.
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
