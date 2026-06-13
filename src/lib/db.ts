import { createClient } from '@supabase/supabase-js';

// Types
export interface GamePrice {
  id: string;
  name: string;
  price_egp: number;
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

// Initial Game Config
export const GAMES_INITIAL: GamePrice[] = [
  { id: 'marvel-rivals', name: 'Marvel Rivals', price_egp: 1500 },
  { id: 'valorant', name: 'Valorant', price_egp: 1500 },
  { id: 'siege', name: 'Rainbow Six Siege', price_egp: 1500 },
  { id: 'overwatch', name: 'Overwatch', price_egp: 1500 },
  { id: 'league', name: 'League of Legends', price_egp: 1500 },
];

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
  PRICES: 'ready_rank_prices_v1',
  INVENTORY: 'ready_rank_inventory_v1',
  ORDERS: 'ready_rank_orders_v1',
  REVIEWS: 'ready_rank_reviews_v1',
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
  if (!localStorage.getItem(LOCAL_KEYS.REVIEWS)) {
    // Seed some mock review data
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

  async updatePrice(gameId: string, price: number): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('game_prices')
          .update({ price_egp: price, updated_at: new Date().toISOString() })
          .eq('id', gameId);
        if (!error) return true;
        console.error('Supabase updatePrice error:', error);
      } catch (err) {
        console.error('Supabase updatePrice catch error:', err);
      }
    }

    // LocalStorage Fallback
    initLocalStorage();
    const prices = await this.getPrices();
    const updated = prices.map(p => p.id === gameId ? { ...p, price_egp: price } : p);
    localStorage.setItem(LOCAL_KEYS.PRICES, JSON.stringify(updated));
    // Dispatch custom event to sync tabs/UI if needed
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

  // --- Orders ---
  async getOrders(adminEmail?: string): Promise<Order[]> {
    if (supabase) {
      try {
        let query = supabase.from('orders').select('*');
        
        // If not admin and email provided, filter
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
    // 1. Fetch available inventory for this game
    let availableItems: InventoryItem[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('accounts_inventory')
          .select('*')
          .eq('game_id', gameId)
          .eq('is_sold', false)
          .order('created_at', { ascending: true })
          .limit(quantity);
        if (error) throw error;
        availableItems = data || [];
      } catch (err) {
        console.error('Supabase fetch inventory error, will fallback to local:', err);
      }
    } else {
      initLocalStorage();
      const localInv = localStorage.getItem(LOCAL_KEYS.INVENTORY);
      const inventory: InventoryItem[] = localInv ? JSON.parse(localInv) : [];
      availableItems = inventory
        .filter(item => item.game_id === gameId && !item.is_sold)
        .slice(0, quantity);
    }

    const credentialsDelivered: string[] = availableItems.map(item => item.credentials_text);

    // If order quantity exceeds preloaded accounts, remaining items are just marked as empty string (manual delivery)
    const emptyCount = quantity - credentialsDelivered.length;
    for (let i = 0; i < emptyCount; i++) {
      credentialsDelivered.push(''); // placeholder indicating manual delivery required
    }

    const orderId = supabase ? undefined : Math.random().toString(36).substring(2, 11);
    const newOrderObj: Omit<Order, 'id'> & { id?: string } = {
      id: orderId,
      user_email: userEmail,
      game_id: gameId,
      quantity,
      total_price: totalPrice,
      credentials_delivered: credentialsDelivered,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        // Insert order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([newOrderObj])
          .select()
          .single();
        
        if (orderError) throw orderError;

        // Update assigned inventory items in Supabase
        if (availableItems.length > 0) {
          const idsToUpdate = availableItems.map(item => item.id);
          const { error: invError } = await supabase
            .from('accounts_inventory')
            .update({
              is_sold: true,
              purchased_by_email: userEmail,
              order_id: orderData.id
            })
            .in('id', idsToUpdate);
          if (invError) console.error('Error updating inventory sold status in Supabase:', invError);
        }

        return orderData;
      } catch (err) {
        console.error('Supabase placeOrder error:', err);
      }
    }

    // LocalStorage fallback execution
    initLocalStorage();
    const orders = await this.getOrders();
    const createdOrder: Order = {
      ...newOrderObj,
      id: orderId!,
    };
    orders.unshift(createdOrder);
    localStorage.setItem(LOCAL_KEYS.ORDERS, JSON.stringify(orders));

    // Update inventory item properties in local storage
    if (availableItems.length > 0) {
      const allInvLocal = localStorage.getItem(LOCAL_KEYS.INVENTORY);
      let fullInventory: InventoryItem[] = allInvLocal ? JSON.parse(allInvLocal) : [];
      const itemIds = new Set(availableItems.map(a => a.id));
      fullInventory = fullInventory.map(item => {
        if (itemIds.has(item.id)) {
          return {
            ...item,
            is_sold: true,
            purchased_by_email: userEmail,
            order_id: createdOrder.id,
          };
        }
        return item;
      });
      localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(fullInventory));
    }

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

    // LocalStorage Fallback
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

    // LocalStorage Fallback
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

    // LocalStorage Fallback
    initLocalStorage();
    const reviews = await this.getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    localStorage.setItem(LOCAL_KEYS.REVIEWS, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
};
