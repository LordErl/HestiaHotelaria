-- ===============================================
-- HESTIA MARKETPLACE - Schema
-- Execute este script no Supabase SQL Editor
-- ===============================================

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Produtos do marketplace
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES marketplace_categories(id),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Preços
    price DECIMAL(10,2) NOT NULL,
    market_price DECIMAL(10,2), -- Preço de mercado para comparação
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Estoque
    stock_quantity INTEGER DEFAULT 0,
    min_order_quantity INTEGER DEFAULT 1,
    
    -- Mídia
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Especificações
    specifications JSONB DEFAULT '{}'::jsonb,
    
    -- Personalização
    customization_available BOOLEAN DEFAULT false,
    customization_options JSONB DEFAULT '{}'::jsonb, -- Ex: {"bordado": {"price": 15, "options": ["logo", "nome"]}}
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pedidos do marketplace
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    order_number VARCHAR(20) UNIQUE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    
    -- Valores
    subtotal DECIMAL(10,2) NOT NULL,
    customization_total DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Endereço
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Pagamento
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id TEXT,
    
    -- Rastreamento
    tracking_code VARCHAR(100),
    tracking_url TEXT,
    
    -- Notas
    notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id),
    
    -- Detalhes do produto no momento da compra
    product_name VARCHAR(200),
    product_sku VARCHAR(50),
    
    -- Quantidade e preço
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Personalização
    customization JSONB DEFAULT '{}'::jsonb, -- Ex: {"bordado": "Logo Hotel ABC", "cor": "branco"}
    customization_price DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Carrinho de compras (temporário)
CREATE TABLE IF NOT EXISTS marketplace_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id),
    product_id UUID REFERENCES marketplace_products(id),
    quantity INTEGER DEFAULT 1,
    customization JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(hotel_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_featured ON marketplace_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_hotel ON marketplace_orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_hotel ON marketplace_cart(hotel_id);

-- Inserir categorias iniciais
INSERT INTO marketplace_categories (name, description, icon, display_order) VALUES
('Enxoval', 'Toalhas, lençóis, roupões e amenidades de banho', 'bed-double', 1),
('Amenities', 'Kits de higiene, sabonetes, shampoos e cosméticos', 'sparkles', 2),
('Decoração', 'Itens decorativos, quadros, vasos e cortinas', 'palette', 3),
('Equipamentos', 'Frigobares, cofres, TVs e eletrônicos', 'monitor', 4),
('Alimentos & Bebidas', 'Café, chás, snacks e minibar', 'coffee', 5),
('Serviços', 'Lavanderia, consultoria e treinamentos', 'briefcase', 6)
ON CONFLICT DO NOTHING;

-- Inserir alguns produtos de exemplo
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, customization_available, customization_options, is_featured) 
SELECT 
    c.id,
    'TOW-PREM-001',
    'Kit Toalhas Premium 500g',
    'Kit com 3 toalhas de banho premium em algodão egípcio 500g/m². Inclui 1 toalha de banho grande (140x70cm), 1 toalha de rosto (80x50cm) e 1 toalha de mãos (50x30cm). Maciez excepcional e alta absorção.',
    'Kit 3 toalhas em algodão egípcio 500g/m² - Branco',
    189.90,
    249.90,
    500,
    '["https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=800"]'::jsonb,
    '{"material": "Algodão Egípcio", "gramatura": "500g/m²", "cor": "Branco", "dimensoes": {"banho": "140x70cm", "rosto": "80x50cm", "maos": "50x30cm"}}'::jsonb,
    true,
    '{"bordado": {"price": 25.00, "description": "Bordado do logo do hotel", "options": ["Logo", "Nome", "Logo + Nome"]}}'::jsonb,
    true
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, is_featured) 
SELECT 
    c.id,
    'AMEN-KIT-001',
    'Kit Amenities Luxo 5 peças',
    'Kit completo de amenities premium para hóspedes. Inclui shampoo, condicionador, sabonete líquido, loção hidratante e sabonete em barra. Fragrância exclusiva de lavanda e alecrim.',
    'Kit 5 amenities premium - Fragrância Lavanda',
    12.90,
    18.90,
    2000,
    '["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"]'::jsonb,
    '{"itens": 5, "fragrancia": "Lavanda e Alecrim", "volume": "30ml cada", "embalagem": "Plástico reciclável"}'::jsonb,
    true
FROM marketplace_categories c WHERE c.name = 'Amenities'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'ROUPA-001',
    'Roupão de Banho Felpudo',
    'Roupão de banho em algodão felpudo 400g/m². Tamanho único com cinto. Conforto e elegância para seus hóspedes.',
    'Roupão felpudo algodão 400g/m² - Branco',
    129.90,
    179.90,
    300,
    '["https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800"]'::jsonb,
    '{"material": "Algodão", "gramatura": "400g/m²", "tamanho": "Único", "cor": "Branco"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'CAFE-PREM-001',
    'Café Premium Torrado e Moído 500g',
    'Café 100% arábica, torra média, ideal para máquinas de café. Sabor encorpado com notas de chocolate e caramelo.',
    'Café arábica premium 500g - Torra média',
    45.90,
    59.90,
    800,
    '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800"]'::jsonb,
    '{"tipo": "100% Arábica", "torra": "Média", "peso": "500g", "notas": "Chocolate e Caramelo"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Alimentos & Bebidas'
ON CONFLICT (sku) DO NOTHING;
