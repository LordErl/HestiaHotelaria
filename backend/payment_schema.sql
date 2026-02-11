-- ===============================================
-- HESTIA - Payment Configuration Schema
-- Execute este script no Supabase SQL Editor
-- ===============================================

-- Tabela de configurações de provedores de pagamento
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    provider_name VARCHAR(50) NOT NULL, -- 'stripe', 'mercado_pago', 'cora'
    is_active BOOLEAN DEFAULT false,
    display_name VARCHAR(100),
    
    -- Stripe config
    stripe_api_key TEXT,
    stripe_webhook_secret TEXT,
    
    -- Mercado Pago config
    mp_access_token TEXT,
    mp_public_key TEXT,
    
    -- CORA config
    cora_client_id TEXT,
    cora_cert_path TEXT,
    cora_key_path TEXT,
    cora_sandbox BOOLEAN DEFAULT true,
    
    -- Metadata
    supported_methods JSONB DEFAULT '[]'::jsonb, -- ['pix', 'credit_card', 'debit_card']
    priority INTEGER DEFAULT 0, -- Ordem de exibição
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(hotel_id, provider_name)
);

-- Tabela de transações de pagamento
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    reservation_id UUID REFERENCES reservations(id),
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'mercado_pago', 'cora'
    
    -- IDs externos
    external_payment_id TEXT,
    checkout_session_id TEXT,
    
    -- Valores
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded', 'expired'
    payment_method VARCHAR(50), -- 'pix', 'credit_card', 'debit_card'
    
    -- PIX específico
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    pix_expiration TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_providers_hotel ON payment_providers(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_hotel ON payment_transactions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reservation ON payment_transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external ON payment_transactions(external_payment_id);

-- Tabela para histórico de chat (se não existir)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    agent_type VARCHAR(50) DEFAULT 'jarbas',
    user_id UUID,
    guest_id UUID,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
