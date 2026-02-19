-- ===============================================
-- HESTIA MARKETPLACE - Produtos Adicionais
-- Execute este script no Supabase SQL Editor
-- ===============================================

-- ENXOVAL (mais produtos)
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, customization_available, customization_options, is_featured) 
SELECT 
    c.id,
    'LEN-PERC-001',
    'Jogo de Lençol Percal 400 fios Casal',
    'Jogo de lençol em percal 400 fios, 100% algodão. Inclui 1 lençol de cima, 1 lençol de baixo com elástico e 2 fronhas. Acabamento premium com pesponto duplo. Toque macio e durabilidade excepcional.',
    'Lençol Percal 400 fios Casal - Branco',
    279.90,
    379.90,
    200,
    '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"]'::jsonb,
    '{"material": "100% Algodão Percal", "fios": "400", "tamanho": "Casal", "itens": "4 peças", "cor": "Branco"}'::jsonb,
    true,
    '{"bordado": {"price": 35.00, "description": "Bordado nas fronhas", "options": ["Logo", "Monograma"]}}'::jsonb,
    false
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, customization_available, customization_options) 
SELECT 
    c.id,
    'LEN-PERC-002',
    'Jogo de Lençol Percal 400 fios Queen',
    'Jogo de lençol em percal 400 fios, 100% algodão para cama Queen. Inclui 1 lençol de cima, 1 lençol de baixo com elástico e 2 fronhas. Acabamento premium.',
    'Lençol Percal 400 fios Queen - Branco',
    329.90,
    449.90,
    150,
    '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"]'::jsonb,
    '{"material": "100% Algodão Percal", "fios": "400", "tamanho": "Queen", "itens": "4 peças"}'::jsonb,
    true,
    '{"bordado": {"price": 35.00, "description": "Bordado nas fronhas", "options": ["Logo", "Monograma"]}}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'TRAV-001',
    'Travesseiro Pluma de Ganso 50x70',
    'Travesseiro premium com enchimento de pluma de ganso. Macio e confortável, ideal para hotéis de luxo. Capa 100% algodão 200 fios.',
    'Travesseiro Pluma de Ganso 50x70cm',
    189.90,
    259.90,
    300,
    '["https://images.unsplash.com/photo-1592789705501-f9ae4287c4e9?w=800"]'::jsonb,
    '{"enchimento": "Pluma de Ganso", "capa": "Algodão 200 fios", "dimensoes": "50x70cm"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'EDRED-001',
    'Edredom Pluma Sintética King',
    'Edredom com enchimento de pluma sintética hipoalergênica. Quente, leve e lavável em máquina. Ideal para todas as estações.',
    'Edredom Pluma Sintética King - Branco',
    459.90,
    599.90,
    100,
    '["https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800"]'::jsonb,
    '{"enchimento": "Pluma Sintética", "tamanho": "King", "gramatura": "300g/m²", "lavavel": "Sim"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, customization_available, customization_options) 
SELECT 
    c.id,
    'CHINELO-001',
    'Chinelo Descartável Spa (Par)',
    'Chinelo descartável para spa e banho. Material macio e confortável. Tamanho único. Embalagem individual.',
    'Chinelo Spa Descartável - Branco',
    4.90,
    7.90,
    5000,
    '["https://images.unsplash.com/photo-1603251578711-3290ca1a0187?w=800"]'::jsonb,
    '{"material": "EVA macio", "tamanho": "Único (36-44)", "embalagem": "Individual"}'::jsonb,
    true,
    '{"personalizacao": {"price": 1.50, "description": "Logo impresso", "options": ["Logo hotel"]}}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Enxoval'
ON CONFLICT (sku) DO NOTHING;

-- AMENITIES (mais produtos)
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, is_featured) 
SELECT 
    c.id,
    'AMEN-PREM-001',
    'Kit Amenities Premium 8 peças',
    'Kit completo premium: shampoo, condicionador, sabonete líquido, loção corporal, creme dental, escova dental, pente e touca de banho. Fragrância Bamboo & Aloe Vera.',
    'Kit 8 amenities premium - Bamboo & Aloe Vera',
    24.90,
    34.90,
    1500,
    '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800"]'::jsonb,
    '{"itens": 8, "fragrancia": "Bamboo & Aloe Vera", "volume": "30ml líquidos", "embalagem": "Caixa personalizada"}'::jsonb,
    true
FROM marketplace_categories c WHERE c.name = 'Amenities'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'AMEN-SAB-001',
    'Sabonete em Barra 30g (Caixa 100un)',
    'Sabonete em barra 30g, fragrância neutra. Embalagem individual em caixa personalizada. Ideal para reposição diária.',
    'Caixa 100 sabonetes 30g - Fragrância Neutra',
    89.90,
    129.90,
    500,
    '["https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800"]'::jsonb,
    '{"peso": "30g cada", "quantidade": "100 unidades", "fragrancia": "Neutra", "embalagem": "Individual"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Amenities'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'AMEN-SHAMP-001',
    'Shampoo Profissional 5L',
    'Shampoo profissional para dispensers. Fórmula suave e hidratante. Fragrância herbal refrescante. Rendimento: ~500 aplicações.',
    'Shampoo Profissional 5 Litros - Herbal',
    79.90,
    109.90,
    200,
    '["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"]'::jsonb,
    '{"volume": "5 Litros", "fragrancia": "Herbal", "rendimento": "~500 aplicações", "tipo": "Dispenser"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Amenities'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'AMEN-KIT-DENT',
    'Kit Dental Hóspede (Caixa 200un)',
    'Kit dental individual: escova + pasta dental 10g. Embalagem higiênica selada. Ideal para cortesia ao hóspede.',
    'Caixa 200 kits dentais completos',
    159.90,
    219.90,
    300,
    '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800"]'::jsonb,
    '{"itens": "Escova + Pasta 10g", "quantidade": "200 kits", "embalagem": "Individual selada"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Amenities'
ON CONFLICT (sku) DO NOTHING;

-- EQUIPAMENTOS
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications, is_featured) 
SELECT 
    c.id,
    'FRIGO-001',
    'Frigobar 46L Silencioso',
    'Frigobar 46 litros com tecnologia de compressor silencioso (38dB). Classificação A de eficiência energética. Porta reversível, luz interna LED.',
    'Frigobar 46L Silencioso Classe A',
    1289.90,
    1599.90,
    50,
    '["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800"]'::jsonb,
    '{"capacidade": "46 Litros", "ruido": "38dB", "eficiencia": "Classe A", "voltagem": "110/220V", "garantia": "2 anos"}'::jsonb,
    true
FROM marketplace_categories c WHERE c.name = 'Equipamentos'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'COFRE-001',
    'Cofre Eletrônico Compact 23L',
    'Cofre eletrônico com teclado digital e chave de emergência. Capacidade para notebook 15". Fixação em móvel ou parede. Memória para 100 senhas.',
    'Cofre Digital 23L com Auditoria',
    459.90,
    599.90,
    100,
    '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"]'::jsonb,
    '{"capacidade": "23 Litros", "teclado": "Digital retroiluminado", "memoria": "100 senhas", "auditoria": "Sim", "garantia": "1 ano"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Equipamentos'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'SECADOR-001',
    'Secador de Cabelo Parede 1600W',
    'Secador de cabelo para instalação em parede. 1600W, 2 velocidades, ar frio. Sensor de presença para desligamento automático. Economia de energia.',
    'Secador Parede 1600W com Sensor',
    189.90,
    259.90,
    150,
    '["https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800"]'::jsonb,
    '{"potencia": "1600W", "velocidades": 2, "ar_frio": "Sim", "sensor": "Desligamento automático", "instalacao": "Parede"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Equipamentos'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'CHALEIRA-001',
    'Chaleira Elétrica Inox 1L',
    'Chaleira elétrica em aço inox 304. Capacidade 1 litro, desligamento automático, base 360°. Ideal para quartos de hotel.',
    'Chaleira Elétrica Inox 1 Litro',
    129.90,
    169.90,
    200,
    '["https://images.unsplash.com/photo-1594213114663-d94db9b3f7d2?w=800"]'::jsonb,
    '{"material": "Inox 304", "capacidade": "1 Litro", "potencia": "1500W", "base": "360°", "garantia": "1 ano"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Equipamentos'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'TV-001',
    'Smart TV 43" 4K Hotel Mode',
    'Smart TV 43 polegadas 4K com Hotel Mode integrado. Permite personalização de canal inicial, bloqueio de configurações e gestão remota.',
    'Smart TV 43" 4K com Hotel Mode',
    1899.90,
    2399.90,
    30,
    '["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800"]'::jsonb,
    '{"tamanho": "43 polegadas", "resolucao": "4K UHD", "hotel_mode": "Sim", "hdmi": "3 portas", "usb": "2 portas", "garantia": "2 anos"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Equipamentos'
ON CONFLICT (sku) DO NOTHING;

-- DECORAÇÃO
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'CORTINA-001',
    'Cortina Blackout 2,80x1,80m',
    'Cortina blackout tecido premium. Bloqueia 100% da luz solar. Isolamento térmico e acústico. Fácil instalação com ilhós.',
    'Cortina Blackout Premium 2,80x1,80m',
    189.90,
    259.90,
    200,
    '["https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800"]'::jsonb,
    '{"dimensoes": "2,80 x 1,80m", "blackout": "100%", "isolamento": "Térmico e acústico", "instalacao": "Ilhós"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Decoração'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'QUADRO-001',
    'Quadro Decorativo Abstrato 60x80',
    'Quadro decorativo com impressão em canvas premium. Arte abstrata moderna em tons neutros. Moldura em madeira natural.',
    'Quadro Abstrato Canvas 60x80cm',
    149.90,
    199.90,
    100,
    '["https://images.unsplash.com/photo-1549887534-1541e9326642?w=800"]'::jsonb,
    '{"dimensoes": "60x80cm", "material": "Canvas premium", "moldura": "Madeira natural", "estilo": "Abstrato moderno"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Decoração'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'VASO-001',
    'Vaso Cerâmica Decorativo 25cm',
    'Vaso decorativo em cerâmica esmaltada. Design minimalista elegante. Perfeito para flores secas ou arranjos artificiais.',
    'Vaso Cerâmica Minimalista 25cm',
    79.90,
    109.90,
    150,
    '["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800"]'::jsonb,
    '{"altura": "25cm", "material": "Cerâmica esmaltada", "estilo": "Minimalista", "cores": "Branco, Cinza, Terracota"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Decoração'
ON CONFLICT (sku) DO NOTHING;

-- ALIMENTOS & BEBIDAS
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'CHA-001',
    'Kit Chás Premium 60 sachês',
    'Caixa com 60 sachês de chás premium: camomila, hortelã, frutas vermelhas, verde com limão. Embalados individualmente.',
    'Kit 60 Chás Premium Variados',
    89.90,
    119.90,
    400,
    '["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800"]'::jsonb,
    '{"quantidade": "60 sachês", "sabores": "4 variações", "embalagem": "Individual", "validade": "24 meses"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Alimentos & Bebidas'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'AGUA-001',
    'Água Mineral 500ml (Fardo 12un)',
    'Água mineral natural sem gás. Garrafas PET 500ml. Ideal para frigobar e eventos.',
    'Fardo 12 Águas Mineral 500ml',
    18.90,
    24.90,
    1000,
    '["https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800"]'::jsonb,
    '{"volume": "500ml cada", "quantidade": "12 garrafas", "tipo": "Sem gás", "material": "PET"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Alimentos & Bebidas'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'SNACK-001',
    'Mix Nuts Premium 50g (Caixa 30un)',
    'Mix de castanhas premium: castanha de caju, amêndoas, nozes e macadâmia. Embalagem individual 50g. Sem sal.',
    'Caixa 30 Mix Nuts Premium 50g',
    179.90,
    239.90,
    200,
    '["https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=800"]'::jsonb,
    '{"peso": "50g cada", "quantidade": "30 unidades", "ingredientes": "Caju, amêndoas, nozes, macadâmia", "sem_sal": "Sim"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Alimentos & Bebidas'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'CHOC-001',
    'Chocolate Belga 25g (Caixa 50un)',
    'Chocolate belga ao leite em barra individual 25g. Embalagem elegante dourada. Perfeito para cortesia ao hóspede.',
    'Caixa 50 Chocolates Belga 25g',
    149.90,
    199.90,
    300,
    '["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800"]'::jsonb,
    '{"peso": "25g cada", "quantidade": "50 unidades", "tipo": "Ao leite", "origem": "Belga"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Alimentos & Bebidas'
ON CONFLICT (sku) DO NOTHING;

-- SERVIÇOS
INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'SERV-LAVAND-001',
    'Serviço de Lavanderia Mensal',
    'Serviço de lavanderia industrial mensal. Inclui lavagem, secagem e dobra de enxoval. Coleta e entrega 2x por semana.',
    'Lavanderia Mensal - até 500kg',
    2899.90,
    3499.90,
    20,
    '["https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800"]'::jsonb,
    '{"capacidade": "Até 500kg/mês", "frequencia": "2x por semana", "inclui": "Lavagem, secagem, dobra", "entrega": "Incluída"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Serviços'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'SERV-CONSULT-001',
    'Consultoria Revenue Management',
    'Consultoria especializada em Revenue Management. Análise de precificação, estratégia de distribuição e otimização de receita. 8 horas.',
    'Consultoria Revenue - 8 horas',
    3500.00,
    4500.00,
    10,
    '["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800"]'::jsonb,
    '{"duracao": "8 horas", "formato": "Presencial ou remoto", "inclui": "Relatório detalhado", "expertise": "Revenue Management"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Serviços'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO marketplace_products (category_id, sku, name, description, short_description, price, market_price, stock_quantity, images, specifications) 
SELECT 
    c.id,
    'SERV-TREIN-001',
    'Treinamento Equipe Recepção',
    'Treinamento completo para equipe de recepção. Atendimento de excelência, check-in/out, gestão de reclamações. Certificado incluso.',
    'Treinamento Recepção - 16 horas',
    4200.00,
    5500.00,
    15,
    '["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"]'::jsonb,
    '{"duracao": "16 horas (2 dias)", "participantes": "Até 15 pessoas", "certificado": "Incluso", "material": "Digital"}'::jsonb
FROM marketplace_categories c WHERE c.name = 'Serviços'
ON CONFLICT (sku) DO NOTHING;
