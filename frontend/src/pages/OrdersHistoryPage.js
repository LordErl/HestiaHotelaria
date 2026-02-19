import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Package, Search, Truck, CheckCircle, Clock, XCircle, 
  Eye, RefreshCw, Calendar, MapPin, ChevronDown, ChevronUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OrdersHistoryPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrderDetails({ ...orderDetails, [orderId]: data });
      setExpandedOrder(orderId);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const formatCurrency = (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', icon: Clock, label: 'Pendente' },
      confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50', icon: CheckCircle, label: 'Confirmado' },
      processing: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50', icon: Package, label: 'Em Preparação' },
      shipped: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50', icon: Truck, label: 'Enviado' },
      delivered: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50', icon: CheckCircle, label: 'Entregue' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', icon: XCircle, label: 'Cancelado' }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    
    return (
      <Badge className={`${style.bg} ${style.text} border ${style.border} flex items-center gap-1`}>
        <Icon className="w-3 h-3" /> {style.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="orders-history-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="w-8 h-8 text-[#D4AF37]" />
            Meus Pedidos
          </h1>
          <p className="text-gray-400">Histórico de pedidos do Marketplace Hestia</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a1929] border-gray-700 w-64"
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" className="border-gray-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-sm text-gray-400">Total de Pedidos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'pending').length}</p>
              <p className="text-sm text-gray-400">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <Truck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'shipped').length}</p>
              <p className="text-sm text-gray-400">Em Trânsito</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'delivered').length}</p>
              <p className="text-sm text-gray-400">Entregues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Nenhum pedido encontrado</p>
            <p className="text-gray-400 mt-2">Você ainda não fez nenhum pedido no Marketplace</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="bg-[#0f2744]/50 border-gray-700/50 overflow-hidden">
              {/* Order Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => fetchOrderDetails(order.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#D4AF37]/20">
                      <Package className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{order.order_number}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {getStatusBadge(order.status)}
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-gray-500">Total do pedido</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Order Details (Expanded) */}
              {expandedOrder === order.id && orderDetails[order.id] && (
                <div className="border-t border-gray-700/50 p-4 bg-[#0a1929]/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#D4AF37]" /> Itens do Pedido
                      </h4>
                      <div className="space-y-2">
                        {orderDetails[order.id].items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-[#0f2744]/50 rounded">
                            <div>
                              <p className="text-white text-sm">{item.product_name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white text-sm">{item.quantity}x {formatCurrency(item.unit_price)}</p>
                              <p className="text-[#D4AF37] text-sm">{formatCurrency(item.subtotal)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Shipping & Totals */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#D4AF37]" /> Endereço de Entrega
                        </h4>
                        {order.shipping_address && (
                          <div className="p-3 bg-[#0f2744]/50 rounded text-sm text-gray-300">
                            <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                            {order.shipping_address.complement && <p>{order.shipping_address.complement}</p>}
                            <p>{order.shipping_address.neighborhood}</p>
                            <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                            <p>CEP: {order.shipping_address.zip}</p>
                          </div>
                        )}
                      </div>
                      
                      {order.tracking_code && (
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                          <p className="text-sm text-cyan-400">
                            <Truck className="w-4 h-4 inline mr-2" />
                            Código de Rastreio: <strong>{order.tracking_code}</strong>
                          </p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-[#0f2744]/50 rounded space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Subtotal</span>
                          <span className="text-white">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.customization_total > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Personalização</span>
                            <span className="text-white">{formatCurrency(order.customization_total)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Frete</span>
                          <span className="text-emerald-400">{order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'Grátis'}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-700">
                          <span className="text-white">Total</span>
                          <span className="text-[#D4AF37]">{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersHistoryPage;
