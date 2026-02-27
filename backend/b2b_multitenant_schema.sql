-- Hestia B2B Multi-Tenant Schema
-- Execute no Supabase SQL Editor APÓS o schema.sql base

-- =====================================================
-- TABELA: organizations (Dados PJ do Hotel Cliente)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID UNIQUE NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Dados Jurídicos
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    
    -- Endereço Legal
    endereco_fiscal VARCHAR(500),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(10),
    pais VARCHAR(100) DEFAULT 'Brasil',
    
    -- Contato Empresarial
    telefone_comercial VARCHAR(50),
    email_financeiro VARCHAR(255),
    email_comercial VARCHAR(255),
    
    -- Responsável Legal
    responsavel_nome VARCHAR(255),
    responsavel_cpf VARCHAR(14),
    responsavel_cargo VARCHAR(100),
    responsavel_telefone VARCHAR(50),
    responsavel_email VARCHAR(255),
    
    -- Dados Bancários
    banco_nome VARCHAR(100),
    banco_agencia VARCHAR(20),
    banco_conta VARCHAR(30),
    banco_tipo_conta VARCHAR(20), -- corrente, poupanca
    banco_pix_chave VARCHAR(100),
    
    -- Contrato e Assinatura Hestia
    plano_assinatura VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    valor_mensalidade DECIMAL(10,2) DEFAULT 0,
    data_inicio_contrato DATE,
    data_fim_contrato DATE,
    status_contrato VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, cancelled
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_hotel ON organizations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status_contrato);

-- =====================================================
-- ATUALIZAÇÃO: tabela users - novo campo role super_admin
-- =====================================================
-- Roles possíveis:
-- super_admin: Admin da plataforma Hestia (vê todos os hotéis)
-- hotel_admin: Admin de um hotel específico (owner do hotel)
-- manager: Gerente de hotel
-- receptionist: Recepcionista
-- housekeeper: Camareira/Limpeza
-- guest: Hóspede

-- Adicionar campo is_super_admin para identificar admins da plataforma
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- =====================================================
-- TABELA: marketplace_partners (Restaurantes, Lojas parceiras)
-- =====================================================
CREATE TABLE IF NOT EXISTS marketplace_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dados do Parceiro
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- restaurant, shop, service, spa
    descricao TEXT,
    logo_url VARCHAR(500),
    imagem_capa_url VARCHAR(500),
    
    -- Localização
    endereco VARCHAR(500),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Contato
    telefone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Operacional
    horario_funcionamento JSONB DEFAULT '{}',
    categorias JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    
    -- Comissão Hestia
    comissao_percentual DECIMAL(5,2) DEFAULT 10.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    total_pedidos INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: partner_products (Produtos/Serviços dos Parceiros)
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES marketplace_partners(id) ON DELETE CASCADE,
    
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    preco DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2),
    
    imagem_url VARCHAR(500),
    disponivel BOOLEAN DEFAULT true,
    tempo_preparo_minutos INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para partner_products
CREATE INDEX IF NOT EXISTS idx_partner_products_partner ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_categoria ON partner_products(categoria);

-- =====================================================
-- TABELA: partner_orders (Pedidos para Parceiros)
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Origem
    hotel_id UUID REFERENCES hotels(id),
    guest_id UUID REFERENCES guests(id),
    reservation_id UUID REFERENCES reservations(id),
    
    -- Guest Info (when not linked to reservation)
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    
    -- Destino
    partner_id VARCHAR(100),
    partner_name VARCHAR(255),
    
    -- Pedido
    order_number VARCHAR(20) UNIQUE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL,
    taxa_entrega DECIMAL(10,2) DEFAULT 0,
    comissao_hestia DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, delivered, cancelled
    payment_method VARCHAR(50) DEFAULT 'room_charge',
    payment_status VARCHAR(50) DEFAULT 'pending',
    
    -- Entrega
    tipo_entrega VARCHAR(50) DEFAULT 'room_delivery', -- room_delivery, pickup
    quarto_entrega VARCHAR(20),
    instrucoes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- =====================================================
-- TABELA: notifications (Sistema de Notificações)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tipo e Conteúdo
    type VARCHAR(50) NOT NULL, -- new_order, reservation, maintenance, alert, message
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    
    -- Destino
    hotel_id UUID REFERENCES hotels(id),
    user_id UUID REFERENCES users(id),
    partner_id VARCHAR(100),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_hotel ON notifications(hotel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Índices para partner_orders
CREATE INDEX IF NOT EXISTS idx_partner_orders_hotel ON partner_orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_partner ON partner_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_guest ON partner_orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_status ON partner_orders(status);

-- =====================================================
-- TABELA: maintenance_requests (Pedidos de Manutenção)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    
    -- Solicitante
    requested_by UUID NOT NULL, -- user_id
    requested_by_type VARCHAR(50) DEFAULT 'staff', -- staff, guest
    
    -- Detalhes
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100), -- eletrica, hidraulica, ar_condicionado, mobilia, etc
    prioridade VARCHAR(50) DEFAULT 'normal', -- baixa, normal, alta, urgente
    
    -- Atribuição
    assigned_to UUID, -- user_id do técnico
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled
    
    -- Resolução
    resolucao TEXT,
    custo_reparo DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Índices para maintenance_requests
CREATE INDEX IF NOT EXISTS idx_maintenance_hotel ON maintenance_requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_room ON maintenance_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned ON maintenance_requests(assigned_to);

-- =====================================================
-- RLS Policies para Multi-Tenant
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_partners" ON marketplace_partners FOR ALL USING (true);
CREATE POLICY "Allow all for partner_products" ON partner_products FOR ALL USING (true);
CREATE POLICY "Allow all for partner_orders" ON partner_orders FOR ALL USING (true);
CREATE POLICY "Allow all for maintenance_requests" ON maintenance_requests FOR ALL USING (true);

-- =====================================================
-- DADOS INICIAIS: Admin Plataforma
-- =====================================================
-- Atualizar admin@hestia.com como super_admin
UPDATE users SET is_platform_admin = true, role = 'admin' WHERE email = 'admin@hestia.com';
