-- Script SQL para criar tabela de tarefas de Housekeeping
-- Execute no Supabase SQL Editor

-- Tabela de Tarefas de Housekeeping
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    room_id UUID REFERENCES rooms(id),
    task_type TEXT NOT NULL CHECK (task_type IN ('cleaning', 'checkout', 'turndown', 'maintenance', 'inspection', 'deep_clean')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    scheduled_time TIME,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_housekeeping_hotel ON housekeeping_tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_room ON housekeeping_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_assigned ON housekeeping_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_housekeeping_created ON housekeeping_tasks(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Staff can view all tasks" ON housekeeping_tasks
    FOR SELECT USING (true);

CREATE POLICY "Staff can create tasks" ON housekeeping_tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update tasks" ON housekeeping_tasks
    FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_housekeeping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER housekeeping_tasks_updated_at
    BEFORE UPDATE ON housekeeping_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_housekeeping_updated_at();

-- Dados de exemplo
INSERT INTO housekeeping_tasks (hotel_id, room_id, task_type, status, priority, notes)
SELECT 
    h.id as hotel_id,
    r.id as room_id,
    'cleaning' as task_type,
    'pending' as status,
    'normal' as priority,
    'Limpeza padrão' as notes
FROM hotels h
CROSS JOIN rooms r
WHERE r.hotel_id = h.id
LIMIT 5;

-- Comentário
COMMENT ON TABLE housekeeping_tasks IS 'Tarefas de housekeeping para o app mobile do staff';
