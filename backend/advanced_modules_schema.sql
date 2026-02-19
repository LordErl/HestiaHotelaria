-- ===============================================
-- HESTIA - Módulos Avançados Schema
-- Execute este script no Supabase SQL Editor
-- ===============================================

-- ================== OTA INTEGRATIONS ==================

-- Configuração de canais OTA
CREATE TABLE IF NOT EXISTS ota_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    channel_name VARCHAR(50) NOT NULL, -- 'booking', 'expedia', 'airbnb', 'decolar'
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    
    -- Credenciais
    api_username TEXT,
    api_password TEXT,
    api_key TEXT,
    api_secret TEXT,
    property_id TEXT, -- ID do hotel na OTA
    
    -- Configurações
    sync_enabled BOOLEAN DEFAULT true,
    sync_inventory BOOLEAN DEFAULT true,
    sync_rates BOOLEAN DEFAULT true,
    sync_reservations BOOLEAN DEFAULT true,
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    
    -- Status
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(hotel_id, channel_name)
);

-- Mapeamento de quartos OTA
CREATE TABLE IF NOT EXISTS ota_room_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES ota_channels(id) ON DELETE CASCADE,
    room_type_id UUID REFERENCES room_types(id),
    ota_room_id TEXT NOT NULL,
    ota_room_name TEXT,
    rate_plan_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reservas vindas de OTAs
CREATE TABLE IF NOT EXISTS ota_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES ota_channels(id),
    reservation_id UUID REFERENCES reservations(id),
    ota_booking_id TEXT NOT NULL,
    ota_confirmation_code TEXT,
    channel_commission DECIMAL(10,2),
    raw_data JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================== GESTÃO DE PESSOAS (RH) ==================

-- Funcionários
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    user_id UUID REFERENCES users(id),
    
    -- Dados pessoais
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    document_cpf VARCHAR(20),
    document_rg VARCHAR(30),
    birth_date DATE,
    address JSONB,
    emergency_contact JSONB,
    
    -- Dados profissionais
    employee_code VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    contract_type VARCHAR(50), -- 'clt', 'pj', 'estagio', 'temporario'
    work_shift VARCHAR(50), -- 'manha', 'tarde', 'noite', 'escala'
    
    -- Salário
    base_salary DECIMAL(10,2),
    salary_type VARCHAR(20), -- 'mensal', 'hora'
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'vacation', 'leave', 'terminated'
    
    -- Documentos
    documents JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Escalas de trabalho
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    employee_id UUID REFERENCES employees(id),
    
    schedule_date DATE NOT NULL,
    shift_start TIME,
    shift_end TIME,
    break_start TIME,
    break_end TIME,
    
    department VARCHAR(100),
    position VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'absent', 'late'
    actual_start TIME,
    actual_end TIME,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Registro de ponto
CREATE TABLE IF NOT EXISTS time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    record_date DATE NOT NULL,
    
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Férias e afastamentos
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    
    leave_type VARCHAR(50) NOT NULL, -- 'vacation', 'sick', 'maternity', 'paternity', 'personal'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    documents JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================== EVENTOS E SALAS ==================

-- Salas de eventos
CREATE TABLE IF NOT EXISTS event_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    space_type VARCHAR(50), -- 'sala_reuniao', 'auditorio', 'salao_festas', 'area_externa'
    
    -- Capacidade
    capacity_theater INTEGER,
    capacity_classroom INTEGER,
    capacity_banquet INTEGER,
    capacity_cocktail INTEGER,
    capacity_u_shape INTEGER,
    
    -- Dimensões
    area_sqm DECIMAL(10,2),
    length_m DECIMAL(5,2),
    width_m DECIMAL(5,2),
    height_m DECIMAL(5,2),
    
    -- Facilidades
    amenities JSONB DEFAULT '[]'::jsonb, -- ['projetor', 'telao', 'som', 'ar_condicionado', 'wifi']
    
    -- Preços
    hourly_rate DECIMAL(10,2),
    half_day_rate DECIMAL(10,2),
    full_day_rate DECIMAL(10,2),
    
    -- Imagens
    images JSONB DEFAULT '[]'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    floor VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Eventos
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    space_id UUID REFERENCES event_spaces(id),
    
    -- Dados do evento
    event_name VARCHAR(300) NOT NULL,
    event_type VARCHAR(100), -- 'corporativo', 'casamento', 'aniversario', 'conferencia', 'workshop'
    description TEXT,
    
    -- Datas
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    setup_time TIME,
    cleanup_time TIME,
    
    -- Participantes
    expected_guests INTEGER,
    confirmed_guests INTEGER,
    
    -- Layout
    room_setup VARCHAR(50), -- 'theater', 'classroom', 'banquet', 'cocktail', 'u_shape'
    
    -- Contratante
    client_name VARCHAR(200),
    client_email VARCHAR(200),
    client_phone VARCHAR(50),
    client_company VARCHAR(200),
    
    -- Valores
    space_rate DECIMAL(10,2),
    equipment_total DECIMAL(10,2),
    catering_total DECIMAL(10,2),
    extra_services DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(50) DEFAULT 'inquiry', -- 'inquiry', 'tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'
    
    -- Notas
    special_requirements TEXT,
    internal_notes TEXT,
    
    -- Reserva associada (se houver hospedagem)
    linked_reservation_id UUID REFERENCES reservations(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Serviços adicionais de eventos
CREATE TABLE IF NOT EXISTS event_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    service_type VARCHAR(100), -- 'catering', 'equipamento', 'decoracao', 'fotografo', 'dj'
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    
    provider_name VARCHAR(200),
    provider_contact VARCHAR(200),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================== ASSINATURAS MARKETPLACE ==================

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Frequência
    billing_cycle VARCHAR(20) NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'quarterly'
    
    -- Produtos incluídos
    products JSONB NOT NULL, -- [{"product_id": "...", "quantity": 10}]
    
    -- Preços
    regular_price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    
    -- Benefícios
    free_shipping BOOLEAN DEFAULT true,
    priority_delivery BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assinaturas ativas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    plan_id UUID REFERENCES subscription_plans(id),
    
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
    
    -- Datas
    start_date DATE NOT NULL,
    next_billing_date DATE,
    last_billing_date DATE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Customização
    custom_products JSONB, -- Override dos produtos do plano
    custom_quantity JSONB,
    
    -- Endereço de entrega
    shipping_address JSONB,
    
    -- Pagamento
    payment_method VARCHAR(50),
    
    -- Notas
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Entregas de assinatura
CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    order_id UUID REFERENCES marketplace_orders(id),
    
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'processing', 'shipped', 'delivered'
    
    amount DECIMAL(10,2),
    paid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================== ÍNDICES ==================

CREATE INDEX IF NOT EXISTS idx_ota_channels_hotel ON ota_channels(hotel_id);
CREATE INDEX IF NOT EXISTS idx_ota_reservations_channel ON ota_reservations(channel_id);
CREATE INDEX IF NOT EXISTS idx_employees_hotel ON employees(hotel_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_work_schedules_employee ON work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_date ON work_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_event_spaces_hotel ON event_spaces(hotel_id);
CREATE INDEX IF NOT EXISTS idx_events_hotel ON events(hotel_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_space ON events(space_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_hotel ON subscriptions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
