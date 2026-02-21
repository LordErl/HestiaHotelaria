-- Script SQL para criar tabelas do App Mobile do Hóspede
-- Execute no Supabase SQL Editor

-- Tabela de Solicitações de Serviço
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    guest_id UUID REFERENCES guests(id),
    room_number TEXT,
    service_type TEXT NOT NULL,
    service_name TEXT NOT NULL,
    notes TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_requests_hotel ON service_requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_guest ON service_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at DESC);

-- RLS (Row Level Security) - Opcional mas recomendado
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Guests can view own requests" ON service_requests
    FOR SELECT USING (true);

CREATE POLICY "Guests can create requests" ON service_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update requests" ON service_requests
    FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_service_requests_updated_at();

-- Comentário
COMMENT ON TABLE service_requests IS 'Solicitações de serviço feitas por hóspedes via app mobile';
