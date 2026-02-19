-- Hestia Loyalty Program Tables
-- Execute este script no Supabase SQL Editor

-- Loyalty Members Table
CREATE TABLE IF NOT EXISTS public.loyalty_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id),
    guest_id UUID NOT NULL REFERENCES public.guests(id),
    current_tier VARCHAR(50) DEFAULT 'Bronze',
    lifetime_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    join_date TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, guest_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;

-- Loyalty Config Table
CREATE TABLE IF NOT EXISTS public.loyalty_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) UNIQUE,
    program_name VARCHAR(100) DEFAULT 'Hestia Rewards',
    points_per_real DECIMAL(10,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;

-- Loyalty Tiers Table
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id),
    name VARCHAR(50) NOT NULL,
    min_points INTEGER DEFAULT 0,
    multiplier DECIMAL(5,2) DEFAULT 1.00,
    benefits JSONB DEFAULT '[]',
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- Loyalty Rewards Table
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Points Transactions Table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.loyalty_members(id),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id),
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'earn', 'redeem', 'adjust'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_members_hotel ON public.loyalty_members(hotel_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_members_guest ON public.loyalty_members(guest_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_member ON public.loyalty_transactions(member_id);

-- RLS Policies (permissive for development)
CREATE POLICY "Allow all operations on loyalty_members" ON public.loyalty_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_config" ON public.loyalty_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_tiers" ON public.loyalty_tiers FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_rewards" ON public.loyalty_rewards FOR ALL USING (true);
CREATE POLICY "Allow all operations on loyalty_transactions" ON public.loyalty_transactions FOR ALL USING (true);

-- Insert default config and tiers for Grand Hestia Palace
INSERT INTO public.loyalty_config (hotel_id, program_name, points_per_real) 
VALUES ('480f0940-81a5-4ca7-806d-77ed790c740a', 'Hestia Rewards', 1.00)
ON CONFLICT (hotel_id) DO NOTHING;

-- Insert default tiers
INSERT INTO public.loyalty_tiers (hotel_id, name, min_points, multiplier, color) VALUES
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Bronze', 0, 1.00, '#CD7F32'),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Silver', 1000, 1.25, '#C0C0C0'),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Gold', 5000, 1.50, '#FFD700'),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Platinum', 15000, 2.00, '#E5E4E2');

-- Insert default rewards
INSERT INTO public.loyalty_rewards (hotel_id, name, description, points_required) VALUES
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Diária Grátis', 'Uma noite grátis no hotel', 2500),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Upgrade de Quarto', 'Upgrade para categoria superior', 1000),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Spa - 1h', 'Tratamento no spa do hotel', 800),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Jantar para 2', 'Experiência gastronômica', 1200),
('480f0940-81a5-4ca7-806d-77ed790c740a', 'Transfer Aeroporto', 'Traslado ida e volta', 500);

COMMENT ON TABLE public.loyalty_members IS 'Membros do programa de fidelidade';
COMMENT ON TABLE public.loyalty_config IS 'Configuração do programa de fidelidade por hotel';
