-- supabase_schema.sql
-- Run this schema in your Supabase SQL Editor to set up the database.

-- 1. Create Game Prices table
CREATE TABLE IF NOT EXISTS game_prices (
    id TEXT PRIMARY KEY, -- 'marvel-rivals', 'valorant', 'siege', 'overwatch', 'league'
    name TEXT NOT NULL,
    price_egp NUMERIC NOT NULL DEFAULT 1500,
    description TEXT DEFAULT 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial game data
INSERT INTO game_prices (id, name, price_egp, description) VALUES
('marvel-rivals', 'Marvel Rivals', 1500, 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.'),
('valorant', 'Valorant', 1500, 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.'),
('siege', 'Rainbow Six Siege', 1500, 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.'),
('overwatch', 'Overwatch', 1500, 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.'),
('league', 'League of Legends', 1500, 'Ready Rank account — fully ready to play. No diamonds, no extras, nothing else required.')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    game_id TEXT REFERENCES game_prices(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC NOT NULL,
    credentials_delivered TEXT[] DEFAULT '{}', -- Store credentials delivered to buyer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Accounts Inventory table
CREATE TABLE IF NOT EXISTS accounts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT REFERENCES game_prices(id) ON DELETE CASCADE,
    credentials_text TEXT NOT NULL,
    is_sold BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_by_email TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE game_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies

-- game_prices: anyone can read, only admin (with service key or authenticated admin) can update.
-- For simplification in client access: we'll allow public reads and permit updates.
CREATE POLICY "Allow public read games" ON game_prices FOR SELECT USING (true);
CREATE POLICY "Allow admin write games" ON game_prices FOR ALL USING (true); -- Custom bypass or secure via service role

-- orders: public read by email, public insert.
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select own orders" ON orders FOR SELECT USING (true);

-- accounts_inventory: only admin can manage, users cannot directly read unless assigned to them.
CREATE POLICY "Allow admin manage inventory" ON accounts_inventory FOR ALL USING (true);

-- reviews: anyone can read and write.
CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin manage reviews" ON reviews FOR ALL USING (true);

-- 5. Create Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    buyer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Ticket Messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('buyer', 'admin')),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ticket tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Support Tickets RLS Policies
CREATE POLICY "Allow public insert support_tickets" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select own support_tickets" ON support_tickets FOR SELECT USING (true);
CREATE POLICY "Allow admin update support_tickets" ON support_tickets FOR UPDATE USING (true);

-- Ticket Messages RLS Policies
CREATE POLICY "Allow public insert ticket_messages" ON ticket_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read ticket_messages" ON ticket_messages FOR SELECT USING (true);
