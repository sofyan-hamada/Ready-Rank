import { createClient } from '@supabase/supabase-js';

// Types
export interface GamePrice {
  id: string;
  name: string;
  price_egp: number;
  description?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  game_id: string;
  credentials_text: string;
  is_sold: boolean;
  purchased_by_email: string | null;
  order_id: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  user_email: string;
  game_id: string;
  quantity: number;
  total_price: number;
  credentials_delivered: string[];
  created_at: string;
}

export interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  approved: boolean;
}

// ---- Support Ticket System ----
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: 'buyer' | 'admin';
  body: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  order_id: string;
  buyer_email: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  messages?: TicketMessage[];
}

const MANUAL_TICKET_DESCRIPTION = 'Ready Rank order - a support ticket opens after checkout so the admin can prepare and deliver the account manually.';

// Initial Game Config
export const GAMES_INITIAL: GamePrice[] = [
  { id: 'marvel-rivals', name: 'Marvel Rivals', price_egp: 1500, description: 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.' },
  { id: 'valorant', name: 'Valorant', price_egp: 1500, description: 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.' },
  { id: 'siege', name: 'Rainbow Six Siege', price_egp: 1500, description: 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.' },
  { id: 'overwatch', name: 'Overwatch', price_egp: 1500, description: 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.' },
  { id: 'league', name: 'League of Legends', price_egp: 1500, description: 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.' },
];

GAMES_INITIAL.forEach((game) => {
  game.description = MANUAL_TICKET_DESCRIPTION;
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials exist and are not placeholder strings
const isSupabaseConfigured = 
  SUPABASE_URL.trim() !== '' && 
  SUPABASE_ANON_KEY.trim() !== '' && 
  !SUPABASE_URL.includes('your-supabase-url') &&
  !SUPABASE_ANON_KEY.includes('your-supabase-anon-key');

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

console.log(`[Ready Rank DB] Supabase initialized: ${!!supabase}`);

// LOCAL STORAGE FALLBACK IMPLEMENTATION
const LOCAL_KEYS = {
  PRICES: 'ready_rank_prices_v2',      // bumped to v2 to pick up description field
  INVENTORY: 'ready_rank_inventory_v1',
  ORDERS: 'ready_rank_orders_v1',
  REVIEWS: 'ready_rank_reviews_v1',
  TICKETS: 'ready_rank_tickets_v1',
  TICKET_MESSAGES: 'ready_rank_ticket_messages_v1',
};

// Initialize localStorage if empty
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(LOCAL_KEYS.PRICES)) {
    localStorage.setItem(LOCAL_KEYS.PRICES, JSON.stringify(GAMES_INITIAL));
  }
  if (!localStorage.getItem(LOCAL_KEYS.INVENTORY)) {
    localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_KEYS.ORDERS)) {
    localStorage.setItem(LOCAL_KEYS.ORDERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_KEYS.TICKETS)) {
    localStorage.setItem(LOCAL_KEYS.TICKETS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_KEYS.TICKET_MESSAGES)) {
    localStorage.setItem(LOCAL_KEYS.TICKET_MESSAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_KEYS.REVIEWS)) {
    const mockReviews: Review[] = [
      {
        id: '1',
        user_name: 'FakerFan99',
        rating: 5,
        comment: 'Fast delivery, ready to play immediately! Reached Level 30 LoL account in seconds.',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        approved: true,
      },
      {
        id: '2',
        user_name: 'ShroudApprentice',
        rating: 4,
        comment: 'Valorant account was exactly as described. Fully unranked ready for placements.',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
        approved: true,
      },
      {
        id: '3',
        user_name: 'OverwatchGod',
        rating: 5,
        comment: '50 Wins account worked flawlessly. Saved me hours of grinding.',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        approved: true,
      },
    ];
    localStorage.setItem(LOCAL_KEYS.REVIEWS, JSON.stringify(mockReviews));
  }
};

// Database Service Interface
export const dbService = {
  isSupabase: () => !!supabase,

  // --- Game Prices ---
  async getPrices(): Promise<GamePrice[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_prices')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) return data;
      } catch (err) {
        console.error('Supabase getPrices error, falling back:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.PRICES);
    return local ? JSON.parse(local) : GAMES_INITIAL;
  },

  async updatePrice(gameId: string, price: number, description: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('game_prices')
          .update({ price_egp: price, description: description, updated_at: new Date().toISOString() })
          .eq('id', gameId);
        if (!error) {
          // Also update localStorage cache so UI refreshes instantly without re-fetch
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(LOCAL_KEYS.PRICES);
            if (cached) {
              const parsed: GamePrice[] = JSON.parse(cached);
              const updated = parsed.map(p => p.id === gameId ? { ...p, price_egp: price, description } : p);
              localStorage.setItem(LOCAL_KEYS.PRICES, JSON.stringify(updated));
            }
            window.dispatchEvent(new Event('storage'));
          }
          return true;
        }
        console.error('Supabase updatePrice error:', error);
      } catch (err) {
        console.error('Supabase updatePrice catch error:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const prices = await this.getPrices();
    const updated = prices.map(p => p.id === gameId ? { ...p, price_egp: price, description: description } : p);
    localStorage.setItem(LOCAL_KEYS.PRICES, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return true;
  },

  // --- Accounts Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('accounts_inventory')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getInventory error, falling back:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.INVENTORY);
    return local ? JSON.parse(local) : [];
  },

  async getStockCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_stock_counts')
          .select('game_id, available_count');
        if (error) throw error;

        (data || []).forEach(item => {
          counts[item.game_id] = item.available_count || 0;
        });
        return counts;
      } catch (err) {
        console.error('Supabase getStockCounts error, falling back:', err);
      }
    }

    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.INVENTORY);
    const inventory: InventoryItem[] = local ? JSON.parse(local) : [];
    inventory.forEach(item => {
      if (!item.is_sold) {
        counts[item.game_id] = (counts[item.game_id] || 0) + 1;
      }
    });
    return counts;
  },

  async addInventory(gameId: string, credentialsText: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('accounts_inventory')
          .insert([{ game_id: gameId, credentials_text: credentialsText }]);
        if (!error) return true;
        console.error('Supabase addInventory error:', error);
      } catch (err) {
        console.error('Supabase addInventory catch error:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const inventory = await this.getInventory();
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      game_id: gameId,
      credentials_text: credentialsText,
      is_sold: false,
      purchased_by_email: null,
      order_id: null,
      created_at: new Date().toISOString(),
    };
    inventory.unshift(newItem);
    localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(inventory));
    return true;
  },

  async deleteInventory(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('accounts_inventory')
          .delete()
          .eq('id', id);
        if (!error) return true;
        console.error('Supabase deleteInventory error:', error);
      } catch (err) {
        console.error('Supabase deleteInventory catch error:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const inventory = await this.getInventory();
    const filtered = inventory.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(filtered));
    return true;
  },

  async reserveInventoryForOrder(order: Order): Promise<number> {
    if (supabase) {
      try {
        const { data: availableItems, error: fetchError } = await supabase
          .from('accounts_inventory')
          .select('id')
          .eq('game_id', order.game_id)
          .eq('is_sold', false)
          .order('created_at', { ascending: true })
          .limit(order.quantity);

        if (fetchError) throw fetchError;
        const idsToUpdate = (availableItems || []).map(item => item.id);
        if (idsToUpdate.length === 0) return 0;

        const { error: updateError } = await supabase
          .from('accounts_inventory')
          .update({
            is_sold: true,
            purchased_by_email: order.user_email,
            order_id: order.id,
          })
          .in('id', idsToUpdate);

        if (updateError) throw updateError;
        return idsToUpdate.length;
      } catch (err) {
        console.error('Supabase reserveInventoryForOrder error:', err);
      }
    }

    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.INVENTORY);
    const inventory: InventoryItem[] = local ? JSON.parse(local) : [];
    let remainingToReserve = order.quantity;
    let reservedCount = 0;

    const updated = inventory.map(item => {
      if (remainingToReserve <= 0 || item.game_id !== order.game_id || item.is_sold) {
        return item;
      }

      remainingToReserve -= 1;
      reservedCount += 1;
      return {
        ...item,
        is_sold: true,
        purchased_by_email: order.user_email,
        order_id: order.id,
      };
    });

    localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(updated));
    return reservedCount;
  },

  // --- Orders ---
  async getOrders(adminEmail?: string): Promise<Order[]> {
    if (supabase) {
      try {
        let query = supabase.from('orders').select('*');
        
        const isAdmin = adminEmail === 'admin@readyrank.com';
        if (!isAdmin && adminEmail) {
          query = query.eq('user_email', adminEmail);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getOrders error, falling back:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.ORDERS);
    const orders: Order[] = local ? JSON.parse(local) : [];
    
    const isAdmin = adminEmail === 'admin@readyrank.com';
    if (adminEmail && !isAdmin) {
      return orders.filter(o => o.user_email.toLowerCase() === adminEmail.toLowerCase());
    }
    return orders;
  },

  async placeOrder(userEmail: string, gameId: string, quantity: number, totalPrice: number): Promise<Order | null> {
    const newOrderObj: Omit<Order, 'id'> & { id?: string } = {
      user_email: userEmail,
      game_id: gameId,
      quantity,
      total_price: totalPrice,
      credentials_delivered: [],
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([newOrderObj])
          .select()
          .single();

        if (orderError) throw orderError;

        await this.createTicket(orderData.id, userEmail, `Order fulfillment #${orderData.id.slice(0, 8)}`);

        return orderData;
      } catch (err) {
        console.error('Supabase placeOrder error:', err);
      }
    }

    // LocalStorage fallback execution
    const localOrderId = Math.random().toString(36).substring(2, 11);
    newOrderObj.id = localOrderId;

    initLocalStorage();
    const orders = await this.getOrders();
    const createdOrder: Order = {
      ...newOrderObj,
      id: localOrderId,
    };
    orders.unshift(createdOrder);
    localStorage.setItem(LOCAL_KEYS.ORDERS, JSON.stringify(orders));

    await this.createTicket(createdOrder.id, userEmail, `Order fulfillment #${createdOrder.id.slice(0, 8)}`);

    // Dispatch order event for live updates
    window.dispatchEvent(new CustomEvent('new-order', { detail: createdOrder }));
    return createdOrder;
  },

  // --- Reviews ---
  async getReviews(): Promise<Review[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getReviews error, falling back:', err);
      }
    }

    initLocalStorage();
    const local = localStorage.getItem(LOCAL_KEYS.REVIEWS);
    return local ? JSON.parse(local) : [];
  },

  async addReview(userName: string, rating: number, comment: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('reviews')
          .insert([{ user_name: userName, rating, comment, approved: true }]);
        if (!error) return true;
        console.error('Supabase addReview error:', error);
      } catch (err) {
        console.error('Supabase addReview catch error:', err);
      }
    }

    initLocalStorage();
    const reviews = await this.getReviews();
    const newReview: Review = {
      id: Math.random().toString(36).substring(2, 11),
      user_name: userName,
      rating,
      comment,
      created_at: new Date().toISOString(),
      approved: true,
    };
    reviews.unshift(newReview);
    localStorage.setItem(LOCAL_KEYS.REVIEWS, JSON.stringify(reviews));
    window.dispatchEvent(new Event('storage'));
    return true;
  },

  async deleteReview(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('reviews')
          .delete()
          .eq('id', id);
        if (!error) return true;
        console.error('Supabase deleteReview error:', error);
      } catch (err) {
        console.error('Supabase deleteReview catch error:', err);
      }
    }

    initLocalStorage();
    const reviews = await this.getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    localStorage.setItem(LOCAL_KEYS.REVIEWS, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    return true;
  },

  // ---- Support Tickets ----

  async createTicket(orderId: string, buyerEmail: string, subject: string): Promise<SupportTicket | null> {
    const newTicket: Omit<SupportTicket, 'id'> & { id?: string } = {
      order_id: orderId,
      buyer_email: buyerEmail,
      subject,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert([newTicket])
          .select()
          .single();
        if (!error && data) return data;
        console.error('Supabase createTicket error:', error);
      } catch (err) {
        console.error('Supabase createTicket catch error:', err);
      }
    }

    initLocalStorage();
    const tickets: SupportTicket[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.TICKETS) || '[]');
    const created: SupportTicket = {
      ...newTicket,
      id: Math.random().toString(36).substring(2, 11),
    };
    tickets.unshift(created);
    localStorage.setItem(LOCAL_KEYS.TICKETS, JSON.stringify(tickets));
    return created;
  },

  async getTickets(buyerEmail?: string): Promise<SupportTicket[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('support_tickets')
          .select('*, messages:ticket_messages(*)');

        const isAdmin = buyerEmail === 'admin@readyrank.com';
        if (!isAdmin && buyerEmail) {
          query = query.eq('buyer_email', buyerEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) return data as SupportTicket[];
        console.error('Supabase getTickets error:', error);
      } catch (err) {
        console.error('Supabase getTickets catch error:', err);
      }
    }

    initLocalStorage();
    const tickets: SupportTicket[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.TICKETS) || '[]');
    const messages: TicketMessage[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.TICKET_MESSAGES) || '[]');

    const isAdmin = buyerEmail === 'admin@readyrank.com';
    const filtered = (!isAdmin && buyerEmail)
      ? tickets.filter(t => t.buyer_email.toLowerCase() === buyerEmail.toLowerCase())
      : tickets;

    return filtered.map(t => ({
      ...t,
      messages: messages.filter(m => m.ticket_id === t.id).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));
  },

  async sendTicketMessage(
    ticketId: string,
    sender: 'buyer' | 'admin',
    body: string,
    attachment?: { url: string; name: string; type: string } | null
  ): Promise<TicketMessage | null> {
    const newMsg: Omit<TicketMessage, 'id'> & { id?: string } = {
      ticket_id: ticketId,
      sender,
      body,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ticket_messages')
          .insert([newMsg])
          .select()
          .single();
        if (!error && data) {
          window.dispatchEvent(new CustomEvent('ticket-message', { detail: data }));
          return data;
        }
        console.error('Supabase sendTicketMessage error:', error);
      } catch (err) {
        console.error('Supabase sendTicketMessage catch error:', err);
      }
    }

    initLocalStorage();
    const messages: TicketMessage[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.TICKET_MESSAGES) || '[]');
    const created: TicketMessage = {
      ...newMsg,
      id: Math.random().toString(36).substring(2, 11),
    };
    messages.push(created);
    localStorage.setItem(LOCAL_KEYS.TICKET_MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('ticket-message', { detail: created }));
    return created;
  },

  async closeTicket(ticketId: string): Promise<boolean> {
    if (supabase) {
      try {
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError) throw ticketError;
        if (ticketData?.status === 'closed') return true;

        if (ticketData?.order_id) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', ticketData.order_id)
            .single();

          if (orderError) throw orderError;
          if (orderData) {
            await this.reserveInventoryForOrder(orderData as Order);
          }
        }

        const { error } = await supabase
          .from('support_tickets')
          .update({ status: 'closed' })
          .eq('id', ticketId);
        if (!error) {
          window.dispatchEvent(new Event('inventory-change'));
          return true;
        }
        console.error('Supabase closeTicket error:', error);
      } catch (err) {
        console.error('Supabase closeTicket catch error:', err);
      }
    }

    initLocalStorage();
    const tickets: SupportTicket[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.TICKETS) || '[]');
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket?.status === 'closed') return true;

    if (ticket?.order_id) {
      const orders: Order[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.ORDERS) || '[]');
      const order = orders.find(o => o.id === ticket.order_id);
      if (order) {
        await this.reserveInventoryForOrder(order);
      }
    }

    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'closed' as const } : t);
    localStorage.setItem(LOCAL_KEYS.TICKETS, JSON.stringify(updated));
    window.dispatchEvent(new Event('inventory-change'));
    return true;
  },
};
