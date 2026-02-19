import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { 
  Package, Search, Plus, Edit2, Trash2, Save, X, RefreshCw,
  DollarSign, BarChart3, AlertTriangle, Eye, EyeOff, Star,
  Truck, CheckCircle, Clock, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MarketplaceAdminPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', short_description: '', category_id: '',
    price: '', market_price: '', stock_quantity: '', sku: '',
    is_active: true, is_featured: false, images: ['']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, ordersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/marketplace/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/marketplace/categories`),
        fetch(`${API_URL}/api/admin/marketplace/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/marketplace/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      setProducts(await productsRes.json());
      setCategories(await categoriesRes.json());
      setOrders(await ordersRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        market_price: parseFloat(newProduct.market_price) || null,
        stock_quantity: parseInt(newProduct.stock_quantity),
        images: newProduct.images.filter(i => i.trim())
      };
      
      const response = await fetch(`${API_URL}/api/admin/marketplace/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        toast.success('Produto criado com sucesso!');
        setShowProductModal(false);
        setNewProduct({ name: '', description: '', short_description: '', category_id: '', price: '', market_price: '', stock_quantity: '', sku: '', is_active: true, is_featured: false, images: [''] });
        fetchData();
      } else {
        toast.error('Erro ao criar produto');
      }
    } catch (error) {
      toast.error('Erro ao criar produto');
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/marketplace/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        toast.success('Produto atualizado');
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/marketplace/orders/${orderId}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success(`Pedido atualizado para: ${status}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const formatCurrency = (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pendente' },
      confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Confirmado' },
      processing: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Preparando' },
      shipped: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Enviado' },
      delivered: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Entregue' }
    };
    const style = styles[status] || styles.pending;
    return <Badge className={`${style.bg} ${style.text}`}>{style.label}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="marketplace-admin-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
            Admin Marketplace
          </h1>
          <p className="text-gray-400">Gerencie produtos e pedidos do Marketplace</p>
        </div>
        
        <Button onClick={fetchData} variant="outline" className="border-gray-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#D4AF37]/20">
                <DollarSign className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-sm text-gray-400">Receita Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_orders}</p>
                <p className="text-sm text-gray-400">Total Pedidos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending_orders}</p>
                <p className="text-sm text-gray-400">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.low_stock_products}</p>
                <p className="text-sm text-gray-400">Estoque Baixo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'bg-[#D4AF37] text-[#0a1929]' : 'text-gray-400'}
        >
          <Package className="w-4 h-4 mr-2" /> Produtos ({products.length})
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'bg-[#D4AF37] text-[#0a1929]' : 'text-gray-400'}
        >
          <Truck className="w-4 h-4 mr-2" /> Pedidos ({orders.length})
        </Button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0a1929] border-gray-700 w-64"
              />
            </div>
            <Button onClick={() => setShowProductModal(true)} className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929]">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-[#0f2744]/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/100'} 
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{product.name}</h3>
                            {product.is_featured && <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />}
                          </div>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-400 mt-1">{product.marketplace_categories?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={product.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                            {product.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500">Preço</p>
                            <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(product.price)}</p>
                          </div>
                          {product.market_price > product.price && (
                            <div>
                              <p className="text-xs text-gray-500">Mercado</p>
                              <p className="text-sm text-gray-400 line-through">{formatCurrency(product.market_price)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Estoque</p>
                            <p className={`text-lg font-bold ${product.stock_quantity < 10 ? 'text-red-400' : 'text-white'}`}>
                              {product.stock_quantity}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateProduct(product.id, { is_active: !product.is_active })}
                          >
                            {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateProduct(product.id, { is_featured: !product.is_featured })}
                          >
                            <Star className={`w-4 h-4 ${product.is_featured ? 'text-[#D4AF37] fill-[#D4AF37]' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-[#0f2744]/50 border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#D4AF37]/20">
                      <Package className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{order.order_number}</p>
                      <p className="text-sm text-gray-400">{order.hotels?.name || 'Hotel'}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}
                    <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(order.total_amount)}</p>
                    
                    <Select value={order.status} onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                      <SelectTrigger className="w-[140px] bg-[#0a1929] border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151E32] border-gray-700">
                        <SelectItem value="pending" className="text-white">Pendente</SelectItem>
                        <SelectItem value="confirmed" className="text-white">Confirmado</SelectItem>
                        <SelectItem value="processing" className="text-white">Preparando</SelectItem>
                        <SelectItem value="shipped" className="text-white">Enviado</SelectItem>
                        <SelectItem value="delivered" className="text-white">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0f2744] border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Novo Produto</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowProductModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-400">Nome *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">SKU</Label>
                  <Input
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                    placeholder="Auto-gerado se vazio"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Categoria *</Label>
                  <Select value={newProduct.category_id} onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}>
                    <SelectTrigger className="bg-[#0a1929] border-gray-700 text-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151E32] border-gray-700">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400">Preço *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Preço Mercado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.market_price}
                    onChange={(e) => setNewProduct({...newProduct, market_price: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Estoque *</Label>
                  <Input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">URL da Imagem</Label>
                  <Input
                    value={newProduct.images[0]}
                    onChange={(e) => setNewProduct({...newProduct, images: [e.target.value]})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-400">Descrição Curta</Label>
                  <Input
                    value={newProduct.short_description}
                    onChange={(e) => setNewProduct({...newProduct, short_description: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-400">Descrição Completa</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="bg-[#0a1929] border-gray-700 text-white"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.is_active}
                      onCheckedChange={(checked) => setNewProduct({...newProduct, is_active: checked})}
                    />
                    <Label className="text-gray-400">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.is_featured}
                      onCheckedChange={(checked) => setNewProduct({...newProduct, is_featured: checked})}
                    />
                    <Label className="text-gray-400">Destaque</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateProduct} className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929]">
                  <Save className="w-4 h-4 mr-2" /> Criar Produto
                </Button>
                <Button variant="outline" onClick={() => setShowProductModal(false)} className="border-gray-700">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketplaceAdminPage;
