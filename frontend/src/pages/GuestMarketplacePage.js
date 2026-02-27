import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  Search, 
  Star, 
  Clock, 
  Phone, 
  ShoppingBag,
  Utensils,
  Sparkles,
  Store,
  Filter,
  X,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuestMarketplacePage = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const typeIcons = {
    restaurant: Utensils,
    spa: Sparkles,
    shop: Store
  };

  const typeLabels = {
    restaurant: 'Restaurante',
    spa: 'Spa & Wellness',
    shop: 'Loja'
  };

  const fetchMarketplace = useCallback(async () => {
    try {
      let url = `${API}/guest/marketplace`;
      const params = new URLSearchParams();
      if (selectedCity) params.append('cidade', selectedCity);
      if (selectedType) params.append('tipo', selectedType);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      setPartners(response.data.partners || []);
      setFilteredPartners(response.data.partners || []);
      setAvailableCities(response.data.available_cities || []);
      setAvailableTypes(response.data.available_types || []);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedType]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  useEffect(() => {
    let filtered = partners;
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorias?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredPartners(filtered);
  }, [searchTerm, partners]);

  const addToCart = (item, partner) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, partner_id: partner.id, partner_name: partner.nome }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(c => c.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(c => 
        c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
      ));
    } else {
      setCart(cart.filter(c => c.id !== itemId));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);

  const mockProducts = [
    { id: 'p1', nome: 'Filé Mignon ao Molho Madeira', preco: 89.90, categoria: 'pratos principais' },
    { id: 'p2', nome: 'Risoto de Camarão', preco: 79.90, categoria: 'pratos principais' },
    { id: 'p3', nome: 'Tiramisu', preco: 32.00, categoria: 'sobremesas' },
    { id: 'p4', nome: 'Água Mineral', preco: 8.00, categoria: 'bebidas' },
    { id: 'p5', nome: 'Suco Natural', preco: 15.00, categoria: 'bebidas' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-gold animate-pulse">Carregando marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <div className="bg-velvet/50 border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-playfair text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-gold" />
                Marketplace Hestia
              </h1>
              <p className="text-sm text-slate-400">Peça de qualquer estabelecimento parceiro</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg"
              data-testid="cart-button"
            >
              <ShoppingBag className="w-5 h-5" />
              Carrinho
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar estabelecimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-obsidian border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                data-testid="search-marketplace"
              />
            </div>
            
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-obsidian border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold/50 focus:outline-none"
              data-testid="filter-city"
            >
              <option value="">Todas as cidades</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-obsidian border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold/50 focus:outline-none"
              data-testid="filter-type"
            >
              <option value="">Todos os tipos</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{typeLabels[type] || type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-slate-400">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map(partner => {
              const TypeIcon = typeIcons[partner.tipo] || Store;
              
              return (
                <div
                  key={partner.id}
                  className="bg-velvet/50 border border-white/5 rounded-xl overflow-hidden hover:border-gold/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedPartner(partner)}
                  data-testid={`partner-card-${partner.id}`}
                >
                  {/* Header with type badge */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{partner.nome}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400">{partner.cidade}</span>
                          </div>
                        </div>
                      </div>
                      {partner.is_featured && (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">Destaque</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{partner.descricao}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <span className="text-white font-medium">{partner.rating?.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-400">{typeLabels[partner.tipo]}</span>
                    </div>

                    {/* Categories */}
                    {partner.categorias && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {partner.categorias.slice(0, 3).map((cat, i) => (
                          <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* View button */}
                    <div className="flex items-center justify-end text-gold text-sm">
                      Ver cardápio <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPartner(null)}>
          <div className="bg-velvet rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 sticky top-0 bg-velvet">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-playfair text-white">{selectedPartner.nome}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">{selectedPartner.endereco}, {selectedPartner.cidade}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-gold fill-gold" />
                  <span className="text-white font-medium">{selectedPartner.rating?.toFixed(1)}</span>
                </div>
                {selectedPartner.telefone && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{selectedPartner.telefone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-300 mb-6">{selectedPartner.descricao}</p>

              <h3 className="text-lg font-semibold text-white mb-4">Cardápio</h3>
              <div className="space-y-3">
                {mockProducts.map(product => {
                  const cartItem = cart.find(c => c.id === product.id);
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{product.nome}</div>
                        <div className="text-sm text-slate-400">{product.categoria}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-gold font-semibold">
                          R$ {product.preco.toFixed(2)}
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-medium w-6 text-center">{cartItem.quantity}</span>
                            <button
                              onClick={() => addToCart(product, selectedPartner)}
                              className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-obsidian hover:bg-gold/90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product, selectedPartner)}
                            className="px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 text-sm"
                            data-testid={`add-to-cart-${product.id}`}
                          >
                            Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowCart(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-velvet" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-playfair text-white">Seu Carrinho</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-obsidian/50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-white text-sm">{item.nome}</div>
                        <div className="text-xs text-slate-400">{item.partner_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item, { id: item.partner_id, nome: item.partner_name })}
                            className="w-6 h-6 bg-gold rounded-full flex items-center justify-center text-obsidian"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-gold text-sm font-medium w-20 text-right">
                          R$ {(item.preco * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Taxa de entrega</span>
                  <span className="text-white font-medium">R$ 5,00</span>
                </div>
                <div className="flex items-center justify-between mb-4 pt-2 border-t border-white/10">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-gold text-xl font-playfair">R$ {(cartTotal + 5).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90"
                  data-testid="checkout-button"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-velvet rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-playfair text-white">Finalizar Pedido</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Seu Nome *</label>
                <input
                  type="text"
                  value={checkoutData.guest_name}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, guest_name: e.target.value }))}
                  required
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  placeholder="João Silva"
                  data-testid="checkout-name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={checkoutData.guest_email}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, guest_email: e.target.value }))}
                  required
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  placeholder="joao@email.com"
                  data-testid="checkout-email"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                <input
                  type="text"
                  value={checkoutData.guest_phone}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, guest_phone: e.target.value }))}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Número do Quarto</label>
                <input
                  type="text"
                  value={checkoutData.room_number}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, room_number: e.target.value }))}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  placeholder="101"
                  data-testid="checkout-room"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Entrega</label>
                <select
                  value={checkoutData.delivery_type}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_type: e.target.value }))}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                >
                  <option value="room_delivery">Entrega no Quarto (+R$ 5,00)</option>
                  <option value="pickup">Retirada no Local</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Forma de Pagamento</label>
                <select
                  value={checkoutData.payment_method}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                  data-testid="checkout-payment"
                >
                  <option value="room_charge">Débito no Quarto</option>
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Instruções (opcional)</label>
                <textarea
                  value={checkoutData.instructions}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none resize-none"
                  placeholder="Ex: Sem cebola, molho à parte..."
                  rows={2}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-obsidian/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-slate-400">{item.quantity}x {item.nome}</span>
                      <span className="text-white">R$ {(item.preco * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  {checkoutData.delivery_type === 'room_delivery' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entrega</span>
                      <span className="text-white">R$ 5,00</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-gold font-semibold">
                      R$ {(cartTotal + (checkoutData.delivery_type === 'room_delivery' ? 5 : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50"
                data-testid="confirm-checkout"
              >
                {checkoutLoading ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-velvet rounded-xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-playfair text-white mb-2">Pedido Confirmado!</h2>
            <p className="text-slate-400 mb-6">{orderSuccess.estimated_delivery}</p>
            
            <div className="bg-obsidian/50 rounded-lg p-4 mb-6 text-left">
              <div className="text-sm text-slate-400 mb-2">Pedidos:</div>
              {orderSuccess.orders?.map((order, i) => (
                <div key={i} className="text-white text-sm">
                  {order.order_number} - {order.partner}
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-slate-400">Total pago</span>
                <span className="text-gold font-semibold">R$ {orderSuccess.checkout_summary?.total?.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOrderSuccess(null);
                setCart([]);
                setShowCart(false);
              }}
              className="w-full py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestMarketplacePage;
